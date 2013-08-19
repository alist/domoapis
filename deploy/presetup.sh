echo 'Setting up SSH'
export SSH_CONFIG=~/.ssh/config; mkdir -p ~/.ssh; touch "$SSH_CONFIG"; if !(grep -q "Host bitbucket.org" "$SSH_CONFIG"); then echo -e "Host bitbucket.org\n\tStrictHostKeyChecking no\n" >> $SSH_CONFIG; fi
mkdir -p ~/.npm; sudo chown -R deploy.deploy ~/.npm
mkdir -p ~/tmp; sudo chown -R deploy.deploy ~/tmp