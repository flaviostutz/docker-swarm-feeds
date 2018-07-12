const Feed = require('feed');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

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
                servicesJson.forEach(function(service) {
                    if (service.Spec != null && service.Spec.Labels != null) {
                        const hostAddress = service.Spec.Labels["traefik.frontend.rule"];
                        if (hostAddress != null) {
                            const address = hostAddress.replace("Host:", "");
                            html += `  <li><a href=http://${address}>http://${address}</a> - ${service.Spec.Name} - ${service.ID} - ${new Date(service.UpdatedAt)}</li>`;
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
                        const hostAddress = service.Spec.Labels["traefik.frontend.rule"];
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
                })
                res.json(JSON.parse(feed.json1()));
            }
        });
        
    }

    static async getSwarmServices() {
        const shellres = await exec('docker service inspect $(docker service ls -q)');
        const services = shellres.stdout;

        const servicesJson = JSON.parse(services);
        servicesJson.sort(function (a, b) {
            return new Date(b.UpdatedAt).getTime() - new Date(a.UpdatedAt).getTime();
        });
        return servicesJson;
    }

}

module.exports = DomainsFeed