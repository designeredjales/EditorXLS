using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace EditorXSL
{
    public sealed class MainForm : Form
    {
        readonly TextBox txtFolder = new TextBox();
        readonly TextBox txtFileName = new TextBox();
        readonly Button btnBrowse = new Button();
        readonly Button btnRun = new Button();
        readonly CheckBox chkBackup = new CheckBox();
        readonly CheckBox chkDryRun = new CheckBox();
        readonly ListBox lstLog = new ListBox();
        readonly Label lblStatus = new Label();

        public MainForm()
        {
            Text = "Editor XSL";
            ClientSize = new Size(640, 400);
            MinimumSize = new Size(480, 320);
            StartPosition = FormStartPosition.CenterScreen;
            Font = new Font("Segoe UI", 9F);

            var lblFolder = new Label { Text = "Pasta:", AutoSize = true, Location = new Point(12, 16) };
            txtFolder.SetBounds(90, 12, 440, 23);
            txtFolder.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;
            txtFolder.TextChanged += delegate { UpdateRunEnabled(); };

            btnBrowse.Text = "Procurar...";
            btnBrowse.SetBounds(538, 11, 90, 25);
            btnBrowse.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            btnBrowse.Click += Browse_Click;

            var lblFile = new Label { Text = "Arquivo:", AutoSize = true, Location = new Point(12, 48) };
            txtFileName.SetBounds(90, 44, 160, 23);
            txtFileName.Text = XslSortRemover.DefaultFileName;
            txtFileName.TextChanged += delegate { UpdateRunEnabled(); };

            chkBackup.Text = "Criar backup (.bak)";
            chkBackup.Checked = true;
            chkBackup.AutoSize = true;
            chkBackup.Location = new Point(270, 46);

            chkDryRun.Text = "Só simular";
            chkDryRun.AutoSize = true;
            chkDryRun.Location = new Point(420, 46);

            btnRun.Text = "Editar XSL";
            btnRun.SetBounds(538, 43, 90, 25);
            btnRun.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            btnRun.Enabled = false;
            btnRun.Click += Run_Click;

            lstLog.SetBounds(12, 80, 616, 285);
            lstLog.Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right;
            lstLog.HorizontalScrollbar = true;
            lstLog.IntegralHeight = false;

            lblStatus.SetBounds(12, 372, 616, 20);
            lblStatus.Anchor = AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right;
            lblStatus.Text = "Selecione a pasta onde procurar os arquivos .xsl.";

            Controls.AddRange(new Control[] { lblFolder, txtFolder, btnBrowse, lblFile, txtFileName, chkBackup, chkDryRun, btnRun, lstLog, lblStatus });
            AcceptButton = btnRun;
        }

        void UpdateRunEnabled()
        {
            btnRun.Enabled = txtFolder.Text.Trim().Length > 0 && txtFileName.Text.Trim().Length > 0;
        }

        void Browse_Click(object sender, EventArgs e)
        {
            using (var dialog = new FolderBrowserDialog())
            {
                dialog.Description = "Selecionar diretório para busca de arquivos .XSL";
                dialog.ShowNewFolderButton = false;
                if (Directory.Exists(txtFolder.Text))
                    dialog.SelectedPath = txtFolder.Text;
                if (dialog.ShowDialog(this) == DialogResult.OK && dialog.SelectedPath != "")
                    txtFolder.Text = dialog.SelectedPath;
            }
        }

        async void Run_Click(object sender, EventArgs e)
        {
            string root = txtFolder.Text.Trim();
            string fileName = txtFileName.Text.Trim();
            bool backup = chkBackup.Checked;
            bool dryRun = chkDryRun.Checked;

            if (!Directory.Exists(root))
            {
                MessageBox.Show(this, "A pasta informada não existe.", "Editor XSL", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            SetBusy(true);
            lstLog.Items.Clear();
            lblStatus.Text = "Procurando arquivos...";
            int changed = 0, errors = 0, total = 0;
            try
            {
                List<string> files = await Task.Run(() => XslSortRemover.FindFiles(root, fileName));
                total = files.Count;
                foreach (string file in files)
                {
                    lblStatus.Text = "Processando " + file;
                    FileResult r = await Task.Run(() => XslSortRemover.ProcessFile(file, backup, dryRun));
                    if (r.Error != null) { errors++; Log("ERRO   " + file + " — " + r.Error); }
                    else if (r.RemovedLines > 0) { changed++; Log((dryRun ? "SIMUL. " : "EDITADO ") + file + " (" + r.RemovedLines + " linha(s))"); }
                    else Log("OK     " + file + " (nada a remover)");
                }
            }
            finally
            {
                SetBusy(false);
            }

            string summary = string.Format("{0} arquivo(s) encontrado(s), {1} {2}, {3} erro(s).",
                total, changed, dryRun ? "seriam editados" : "editado(s)", errors);
            lblStatus.Text = summary;
            MessageBox.Show(this, total == 0 ? "Nenhum arquivo \"" + fileName + "\" encontrado." : summary,
                "Ação completa", MessageBoxButtons.OK, errors > 0 ? MessageBoxIcon.Warning : MessageBoxIcon.Information);
        }

        void Log(string line)
        {
            lstLog.Items.Add(line);
            lstLog.TopIndex = lstLog.Items.Count - 1;
        }

        void SetBusy(bool busy)
        {
            Cursor = busy ? Cursors.WaitCursor : Cursors.Default;
            btnRun.Enabled = !busy;
            btnBrowse.Enabled = !busy;
            if (!busy) UpdateRunEnabled();
        }
    }
}
