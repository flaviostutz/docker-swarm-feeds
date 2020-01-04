const Feed = require('feed');
const util = require('util');
const { spawn } = require('child_process');

class DomainsFeed {

    static config(app) {

        app.get('/traefik-domains', async (req, res) => {

            //generate html page
            if (req.query.format=='html') {
                let html = `<!DOCTYPE html><html>`;
                html += `<head>`;
                html += `  <title>Traefik domains - ${process.env.FEED_NAME}</title>`;
                html += `</head>`;
                html += '<body style="color: #685206; font-family: \'Helvetica Neue\', sans-serif; font-size: 16px; line-height: 24px; margin: 0 0 0 24px; text-align: justify; text-justify: inter-word;">';

                html += `<h3>Traefik domains - ${process.env.FEED_NAME}</h3>`;

                html += '<ul>';
                const servicesJson = await DomainsFeed.getSwarmServices();
                // console.log(">>>>json " + JSON.stringify(servicesJson));
                servicesJson.forEach(function(service) {
                    // console.log(">>>>" + service)
                    if (service.Spec != null && service.Spec.Labels != null) {
                        for (var key in service.Spec.Labels) {
                            var value = service.Spec.Labels[key];
                            // console.log(">>>>v" + value + " k="+ key)
                            var re = /traefik\..*frontend\.rule/;
                            var r = key.match(re)
                            // console.log(">>>>m " + r)
                            if (r) {
                                const hostAddress = value;
                                if (hostAddress != null) {
                                    const address = hostAddress.replace("Host:", "");
                                    var addresses = address.split(',')
                                    for (var i=0; i < addresses.length; i++) { 
                                        var addr = addresses[i].trim()
                                        html += `  <li><a href=http://${addr}>http://${addr}</a> - ${service.Spec.Name} - ${service.ID} - ${new Date(service.UpdatedAt)}</li>`;
                                    }
                                }
                            }
                        }
                    }
                })
                html += '</ul>';

                html += '</body></html>';
                res.set('Content-Type', 'text/html');
                res.send(html);

            //generate feed in json format
            } else {
                const feed = new Feed({
                    title: `Traefik domains - ${process.env.FEED_NAME}`,
                    description: `Traefik domains - ${process.env.FEED_NAME}`,
                    updated: new Date()
                })

                const servicesJson = await DomainsFeed.getSwarmServices();
                servicesJson.forEach(function (service) {
                    if (service.Spec != null && service.Spec.Labels != null) {
                        for (var key in service.Spec.Labels) {
                            var value = service.Spec.Labels[key];
                            // service.Spec.Labels["traefik.frontend.rule"];
                            var re = /traefik\..*frontend\.rule/;
                            var r = key.match(re)
                            if (r) {
                                const hostAddress = value;
                                if (hostAddress != null) {
                                    const address = hostAddress.replace("Host:", "");
                                    feed.addItem({
                                        id: service.ID,
                                        date: new Date(service.UpdatedAt),
                                        title: service.Spec.Name,
                                        link: `http://${address}`,
                                    })
                                }
                            }
                        }
                    }
                })
                res.json(JSON.parse(feed.json1()));
            }
        });
        
    }

    static async getSwarmServices() {
        return new Promise(async (resolve, reject) => {
            try {

                //docker service inspect $(docker service ls - q)
                let servicesList = await DomainsFeed.spawnSync('docker service ls -q');
                String.prototype.replaceAll = function (search, replacement) {
                    var target = this;
                    return target.replace(new RegExp(search, 'g'), replacement);
                };
                servicesList = servicesList.replaceAll('\n', ' ').trim();
                const services = await DomainsFeed.spawnSync(`docker service inspect ${servicesList}`);
                const servicesJson = JSON.parse(services);
                servicesJson.sort(function (a, b) {
                    return new Date(b.UpdatedAt).getTime() - new Date(a.UpdatedAt).getTime();
                });
                resolve(servicesJson);
                
            } catch (error) {
                console.log(error);
                reject("ERROR: "+ error);
            }
        });
    }

    static async spawnSync(command) {
        return new Promise((resolve, reject)=> {
            const tc = command.split(' ');
            const cmd = tc.shift();
            const shellres = spawn(cmd, tc);

            let result = '';
            shellres.on('error', (error) => {
                console.log(`ERROR: ${error}`);
                reject(error);
            })
            shellres.stdout.on('data', (data) => {
                result += data
            });
            shellres.stderr.on('data', (data) => {
                console.log(`STERR: ${data}`);
                reject(data);
            });
            shellres.on('close', (code) => {
                resolve(result);
            });
        });
    }

}

module.exports = DomainsFeed