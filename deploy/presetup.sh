echo 'Setting up SSH'
export SSH_CONFIG=~/.ssh/config; mkdir -p ~/.ssh; touch "$SSH_CONFIG"; if !(grep -q "Host bitbucket.org" "$SSH_CONFIG"); then echo -e "Host bitbucket.org\n\tStrictHostKeyChecking no\n" >> $SSH_CONFIG; fi

abspath() {
    if [[ -d "$1" ]]
    then
        pushd "$1" >/dev/null
        pwd
        popd >/dev/null
    elif [[ -e $1 ]]
    then
        pushd "$(dirname "$1")" >/dev/null
        echo "$(pwd)/$(basename "$1")"
        popd >/dev/null
    else
        echo "$1" does not exist! >&2
        return 127
    fi
}


export APP_ROOT=`abspath .`
cd "$APP_ROOT"
chmod +x "$APP_ROOT/deploy/*.sh"