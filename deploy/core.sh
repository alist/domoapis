#!/bin/bash

cd "$APP_ROOT"

log() {
  echo "  ○ $@"
}

setup(){
	type forever >/dev/null 2>&1 || {
		log "Setting up forever"
		sudo npm install -g forever
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
	setup_db
}


setup_db(){
  node "${APP_ROOT}/deploy/genDbConfig.js"
	mongo --port 18001 --host 127.0.0.1 "${APP_ROOT}/deploy/mongodbSetup.js"
}


unload(){
	log "Unloading Server..."
	forever stop "${APP_ROOT}/app.js"
}


load(){
	log "Loading Server..."
	mkdir -p "${APP_ROOT}/logs"
	export NODE_ENV='production'
	forever start -m 20 --minUptime 5000 --spinSleepTime 2000 --pidFile "${APP_ROOT}/logs/pid" -l "${APP_ROOT}/logs/forever.log" --append -o "${APP_ROOT}/logs/out.log" -e "${APP_ROOT}/logs/err.log" "${APP_ROOT}/app.js"
}

reload(){
	unload
	npm_install
	load
	forever_list
}


npm_install(){
	log "Updating modules..."
	npm install --production --save
	if (test $? -ne 0)
	then
		sudo npm install --production
	fi
}

forever_list(){
	log "Forever list..."
	forever list
}


if [ "$#" -eq 0 ]; then
	echo "Please specify an action: [setup|setup_db|load|unload|reload|forever_list|npm_install]"
	exit
fi

log "APP_ROOT=$APP_ROOT"
eval "$1"

if [ "$?" -ne "0" ]; then
        echo "Error: command not found"
fi