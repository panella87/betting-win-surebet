# SSH key setup for artifact pulls

Use this once from WSL on the laptop so `pull_artifacts_and_zip_codebase.sh` can connect to the server without storing the server password.

Create a dedicated key:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
ssh-keygen -t ed25519 -a 100 -f ~/.ssh/ollama_node_repo_automation_ed25519 -C "ollama-node-repo-automation"
```

Install the public key on the server once:

```bash
cat ~/.ssh/ollama_node_repo_automation_ed25519.pub | ssh dev@SERVER_IP 'umask 077; mkdir -p ~/.ssh; cat >> ~/.ssh/authorized_keys'
```

Create or edit:

```bash
nano ~/.ssh/config
```

Add:

```sshconfig
Host ollama-node
  HostName SERVER_IP
  User dev
  IdentityFile ~/.ssh/ollama_node_repo_automation_ed25519
  IdentitiesOnly yes
```

Secure and test:

```bash
chmod 600 ~/.ssh/config
chmod 600 ~/.ssh/ollama_node_repo_automation_ed25519
ssh ollama-node 'hostname && pwd'
```

Optional passphrase caching inside WSL:

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/ollama_node_repo_automation_ed25519
```

After this, the pull script defaults to `dev@ollama-node` and remote path `/home/dev/app_testing/<repo>/artifacts.zip`.
