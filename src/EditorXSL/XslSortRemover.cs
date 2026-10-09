using System;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace EditorXSL
{
    /// <summary>Resultado do processamento de um arquivo.</summary>
    public sealed class FileResult
    {
        public string Path;
        public int RemovedLines;
        public string Error;

        public bool Changed { get { return RemovedLines > 0 && Error == null; } }
    }

    /// <summary>
    /// Núcleo do Editor XSL: remove do recents.xsl do Promob a ordenação por data
    /// (&lt;xsl:sort select="@date" order="descending"/&gt;).
    /// </summary>
    public static class XslSortRemover
    {
        public const string DefaultFileName = "recents.xsl";

        // Uma linha só é removida se contiver TODOS os termos (sem diferenciar maiúsculas).
        static readonly string[] Tokens = { "xsl:sort", "select", "\"@date\"", "order", "\"descending\"" };

        public static bool IsDateSortLine(string line)
        {
            foreach (string token in Tokens)
            {
                if (line.IndexOf(token, StringComparison.OrdinalIgnoreCase) < 0)
                    return false;
            }
            return true;
        }

        /// <summary>Busca recursiva que ignora pastas sem permissão em vez de abortar tudo.</summary>
        public static List<string> FindFiles(string root, string fileName)
        {
            var found = new List<string>();
            var pending = new Stack<string>();
            pending.Push(root);
            while (pending.Count > 0)
            {
                string dir = pending.Pop();
                try
                {
                    found.AddRange(Directory.GetFiles(dir, fileName));
                    foreach (string sub in Directory.GetDirectories(dir))
                        pending.Push(sub);
                }
                catch (UnauthorizedAccessException) { }
                catch (PathTooLongException) { }
                catch (IOException) { }
            }
            found.Sort(StringComparer.OrdinalIgnoreCase);
            return found;
        }

        /// <summary>
        /// Remove as linhas de ordenação por data. Preserva codificação (incl. BOM) e quebras de linha.
        /// Arquivos sem a linha não são reescritos. Com dryRun só conta o que seria removido.
        /// </summary>
        public static FileResult ProcessFile(string path, bool createBackup, bool dryRun)
        {
            var result = new FileResult { Path = path };
            string tempPath = path + ".temp";
            try
            {
                byte[] bytes = File.ReadAllBytes(path);
                Encoding encoding = DetectEncoding(bytes);
                string text = encoding.GetString(bytes, encoding.GetPreamble().Length, bytes.Length - encoding.GetPreamble().Length);

                var output = new StringBuilder(text.Length);
                int start = 0;
                while (start < text.Length)
                {
                    int end = text.IndexOf('\n', start);
                    int next = end < 0 ? text.Length : end + 1;
                    string lineWithBreak = text.Substring(start, next - start);
                    if (IsDateSortLine(lineWithBreak))
                        result.RemovedLines++;
                    else
                        output.Append(lineWithBreak);
                    start = next;
                }

                if (result.RemovedLines == 0 || dryRun)
                    return result;

                if (createBackup)
                    File.Copy(path, path + ".bak", true);

                // Grava em arquivo temporário e só então substitui o original.
                File.WriteAllText(tempPath, output.ToString(), encoding);
                File.Copy(tempPath, path, true);
                File.Delete(tempPath);
            }
            catch (Exception ex)
            {
                result.Error = ex.Message;
                try { if (File.Exists(tempPath)) File.Delete(tempPath); } catch { }
            }
            return result;
        }

        static Encoding DetectEncoding(byte[] b)
        {
            if (b.Length >= 3 && b[0] == 0xEF && b[1] == 0xBB && b[2] == 0xBF) return new UTF8Encoding(true);
            if (b.Length >= 2 && b[0] == 0xFF && b[1] == 0xFE) return new UnicodeEncoding(false, true);
            if (b.Length >= 2 && b[0] == 0xFE && b[1] == 0xFF) return new UnicodeEncoding(true, true);
            return new UTF8Encoding(false);
        }
    }
}
