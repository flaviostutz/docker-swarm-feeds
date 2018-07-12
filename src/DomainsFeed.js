const Feed = require('feed');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

class DomainsFeed {

    static config(app) {

        app.get('/traefik-domains', async (req, res) => {

            const format = req.query.format;
            //generate html page
            if(format=='html') {
                res.send();

            //generate feed in json format
            } else {
                let feed = new Feed({
                    title: `Traefik domains - ${process.env.FEED_NAME}`,
                    description: `Traefik domains - ${process.env.FEED_NAME}`,
                    updated: new Date()
                })

                let servicesJson = await DomainsFeed.getSwarmServices();
                servicesJson.forEach(function (service) {
                    if (service.Spec != null && service.Spec.Labels != null) {
                        let hostAddress = service.Spec.Labels["traefik.frontend.rule"];
                        if (hostAddress != null) {
                            let address = hostAddress.replace("Host:", "");
                            feed.addItem({
                                id: service.ID,
                                date: new Date(service.UpdatedAt),
                                title: service.Spec.Name,
                                link: `http://${address}`,
                            })
                        }
                    }
                })
                res.send(feed.json1());
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