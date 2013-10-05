#!/bin/bash

cd "$APP_ROOT"

log() {
  echo "  ○ $@"
}

setup(){
  type pm2 >/dev/null 2>&1 || {
    log "Setting up pm2"
    sudo npm install -g pm2
  }

  if [ ! -e "${APP_ROOT}/logs" ]; then
    mkdir -p "${APP_ROOT}/logs"
    if (test $? -eq 0)
    then
      log "Created logs directory: ${APP_ROOT}/logs"
    else
      log "Error creating logs directory: ${APP_ROOT}/logs"
    fi
  fi

  npm_install
  setup_db
}


setup_db(){
  export SETUPDB_USE_ENV=1
  export MONGODB_URI='mongodb://app1:swbo10a87@127.0.0.1:18001/domo'
  node "${APP_ROOT}/deploy/setupDb.js"
}


unload(){
  log "Unloading Server..."
  pm2 stop "domo-refac"
}


load(){
  log "Loading Server..."
  mkdir -p "${APP_ROOT}/logs"
  export NODE_ENV='production'
  export PORT=4000
  export MONGODB_URI='mongodb://app1:swbo10a87@127.0.0.1:18001/domo'
  pm2 start "${APP_ROOT}/app.js" --name "domo-refac" -i 4 -e "${APP_ROOT}/logs/err.log" -o "${APP_ROOT}/logs/out.log" -w
}

reload(){
  unload
  npm_install
  load
  pm2_list
}


npm_install(){
  log "Updating modules..."
  npm install
}

pm2_list(){
  log "pm2 list..."
  pm2 list
}


if [ "$#" -eq 0 ]; then
  echo "Please specify an action: [setup|setup_db|load|unload|reload|pm2_list|npm_install]"
  exit
fi

log "APP_ROOT=$APP_ROOT"
eval "$1"

if [ "$?" -ne "0" ]; then
        echo "Error: command not found"
fi