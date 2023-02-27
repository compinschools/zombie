fx_version 'cerulean'
game 'gta5'
ui_page 'main.html'
author 'Bomberman'
description 'Play zombie tag with multiple other players'
version '1.00.0'

resource_type 'gametype' { name = 'zombie' }
files{
    'permissions.json',
    'containerData.json',
}
client_script 'zombie_client.js'
client_script 'readytext_client.js'
server_script 'zombie_server.js'

