using System;
using System.IO;
using System.Windows.Forms;

namespace EditorXSL
{
    static class Program
    {
        /// <summary>
        /// Sem argumentos abre a janela. Modo linha de comando:
        ///   EditorXSL.exe "C:\pasta" [--arquivo recents.xsl] [--sem-backup] [--simular]
        /// </summary>
        [STAThread]
        static int Main(string[] args)
        {
            if (args.Length > 0)
                return RunCommandLine(args);

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
            return 0;
        }

        static int RunCommandLine(string[] args)
        {
            string root = null, fileName = XslSortRemover.DefaultFileName;
            bool backup = true, dryRun = false;
            for (int i = 0; i < args.Length; i++)
            {
                if (args[i] == "--arquivo" && i + 1 < args.Length) fileName = args[++i];
                else if (args[i] == "--sem-backup") backup = false;
                else if (args[i] == "--simular") dryRun = true;
                else root = args[i];
            }
            if (root == null || !Directory.Exists(root))
            {
                Console.Error.WriteLine("Pasta inválida. Uso: EditorXSL.exe \"C:\\pasta\" [--arquivo recents.xsl] [--sem-backup] [--simular]");
                return 2;
            }

            int errors = 0;
            foreach (string file in XslSortRemover.FindFiles(root, fileName))
            {
                FileResult r = XslSortRemover.ProcessFile(file, backup, dryRun);
                if (r.Error != null) { errors++; Console.Error.WriteLine("ERRO    " + file + " — " + r.Error); }
                else Console.WriteLine((r.RemovedLines > 0 ? (dryRun ? "SIMUL.  " : "EDITADO ") : "OK      ") + file + " (" + r.RemovedLines + ")");
            }
            return errors > 0 ? 1 : 0;
        }
    }
}
