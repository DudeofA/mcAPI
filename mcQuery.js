/*
Andrew Langhill
mcQuery.js
ES6 module to query a Minecraft server
*/

const FIELDS = 6;

class ServerStats {
    // Validate input and get port from SRV record if necessary
    validateInput() {
        // Validate ip
        if (this.ip == undefined) {
            this.online = false;
            this.error = "ip address/hostname not given";
            return false;
        } else if (this.port <= 0 || this.port >= 65536) {
            this.online = false;
            this.error = "invalid port, should be >= 0 and < 65536";
            return false;
        }
        return true;
    }
}

module.exports = async function mcQuery(ip, port) {
    var server = new ServerStats;
    server.ip = ip;
    server.port = port;

    if (!server.validateInput()) {
        return server;
    }
    if (server.port == undefined) {
        // Retrieve the port from the SRV record found at the address
        let dns = require('dns').promises;

        await dns.resolveSrv("_minecraft._tcp." + server.ip)
        .then((result) => {
            server.port = result[0].port;
        })
        .catch((err) => {
            server.port = 25565;
        });      
    }

    var promise = new Promise(function(resolve, reject) {

        // Make initial connection and send the query packet
        const net = require('net')
        const client = net.connect(server.port, server.ip, () => {
            var buff = Buffer.from([0xFE, 0x01]);
            client.write(buff);
        });

        client.setTimeout(5000);

        // On data reception, validate and save
        client.on('data', (data) => {

            if (data != null && data != '') {

                var server_info = data.toString().split("\x00\x00\x00");

                if (server_info != null && server_info.length >= FIELDS) {

                    server.online = true;
                    server.version = server_info[2].replace(/\u0000/g, '');
                    server.motd = server_info[3].replace(/\u0000/g, '');
                    server.current_players = server_info[4].replace(/\u0000/g, '');
                    server.max_players = server_info[5].replace(/\u0000/g, '');
                } else {
                    server.online = false;
                    server.error = "response from server invalid";
                    reject(server);
                    return promise;
                }
            }

            client.end();
            resolve(server);
            return promise;
        });

        client.on('timeout', () => {
            server.online = false;
            server.error = "timeout while querying server";
            client.end();
            reject(server);
            return promise;
        });

        client.on('end', () => {

        });

        client.on('error', (err) => {

            switch(err.code) {
                case "ENOTFOUND":
                    server.error = "hostname/ip address not found";
                    break;
                case "ECONNREFUSED":
                    server.error = "connection refused to specified server";
                    break;
                case "EHOSTUNREACH":
                    server.error = "host unreachable";
                    break;
                case "EINVAL":
                    server.error = "invalid hostname/ip address";
                    break;
                default:
                    console.log("ERRCODE: " + err.code);
                    server.error = "unknown error";

            }

            server.online = false;
            client.end();
            reject(server);
            return promise;
        });
    });

    return promise;
}

