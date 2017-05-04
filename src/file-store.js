const uid = require("uid-safe")
const Promise = require("bluebird")
const mkdirp = require("mkdirp")
const glob = require("glob")

const fs = Promise.promisifyAll(require("fs"));
const globAsync = Promise.promisify(glob);


class FileStore {

	constructor(serverOpts) {
		this.dir = serverOpts.directory || '/tmp';
		this.pfx = serverOpts.prefix || 'session-';
		this.sfx = serverOpts.suffix || '.json';
		this.sidLength = serverOpts.sidLength || 24;
		this.maxAge = serverOpts.maxAge || (86400 * 14);

		this.gcFrequency = serverOpts.gcFrequency || 0;
		this.gcCounter = 0;

		// try to create the session dir if it doesn't exist
		try {
			var stat = fs.statSync(this.dir);
		} catch(e) {
			mkdirp.sync(this.dir);
		}
	}


	async get(sid) {

		var sess = {
			id: null,
			data: {},
		};

		// make sure given sid matches our format
		if (!sid || sid.length !== this.sidLength) {
			sid = null; // invalid sid
		}

		if (sid) {

			try {
				var data = await fs.readFileAsync(`${this.dir}/${this.pfx}${sid}${this.sfx}`, 'utf8');
				if (data) {
					sess.data = JSON.parse(data);
				}
				sess.id = sid;
			} catch(e) {
				// session file not found, or format bad
			}
		}

		return sess;
	}


	async set(sid, data) {

		if (!sid) {
			sid = await this.makeId(this.sidLength);
		}

		try {
			await fs.writeFileAsync(`${this.dir}/${this.pfx}${sid}${this.sfx}`, JSON.stringify(data), 'utf8');
		} catch(e) {
			throw e;
		}

		return sid; // return the session id
	}


	// given a session identifier, destroy a session
	async destroy(sid) {
		try {
			return await fs.unlinkAsync(`${this.dir}/${this.pfx}${sid}${this.sfx}`);
		} catch(e) {
			if (e.code != "ENOENT") {
				console.log('unable to delete session file', e);
			}
		}
	}


	// garbage collect written session data that is expired
	async gc() {

		if (this.gcFrequency == 0) return;

		this.gcCounter++;

		if (this.gcCounter == this.gcFrequency) {

			this.gcCounter = 0;

			// run garbage collection on expired sessions

			try {
				var files = await globAsync(`${this.dir}/${this.pfx}*${this.sfx}`, { nomount: true });

				var now = Date.now();

				files.forEach(async (f) => {
					var s = await fs.statAsync(f);
					if (now - s.ctime > (this.maxAge * 1000)) {
						try {
							await fs.unlinkAsync(f);
						} catch(e) {
							console.log("unable to delete expired session file:", f);
						}
					}
				})
			} catch(e) {
				console.log('error while garbage collecting session', e);
			}

		}

		return; // return null
	}


	async makeId(strlen) {
		// compute the byte length we need to get the right string length we asked for
		var blen = Math.ceil((3 * strlen) / 4);

		// add +1 byte to make sure we eat the padding (which we probably don't need)
		// I'm too lazzy to figure this out exactly right now - TODO
		var id = await uid(blen + 1);

		// trim to correct length
		id = id.substr(0, strlen);

	  return id
	}

}


module.exports = FileStore





