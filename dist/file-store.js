"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var uid = require("uid-safe");
var Promise = require("bluebird");
var mkdirp = require("mkdirp");
var glob = require("glob");

var fs = Promise.promisifyAll(require("fs"));
var globAsync = Promise.promisify(glob);

var FileStore = function () {
	function FileStore(serverOpts) {
		_classCallCheck(this, FileStore);

		this.dir = serverOpts.directory || '/tmp';
		this.pfx = serverOpts.prefix || 'session-';
		this.sfx = serverOpts.suffix || '.json';
		this.sidLength = serverOpts.sidLength || 24;
		this.maxAge = serverOpts.maxAge || 86400 * 14;

		this.gcFrequency = serverOpts.gcFrequency || 0;
		this.gcCounter = 0;

		// try to create the session dir if it doesn't exist
		try {
			var stat = fs.statSync(this.dir);
		} catch (e) {
			mkdirp.sync(this.dir);
		}
	}

	_createClass(FileStore, [{
		key: "get",
		value: function () {
			var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(sid) {
				var sess, data;
				return regeneratorRuntime.wrap(function _callee$(_context) {
					while (1) {
						switch (_context.prev = _context.next) {
							case 0:
								sess = {
									id: null,
									data: {}
								};

								// make sure given sid matches our format

								if (!sid || sid.length !== this.sidLength) {
									sid = null; // invalid sid
								}

								if (!sid) {
									_context.next = 13;
									break;
								}

								_context.prev = 3;
								_context.next = 6;
								return fs.readFileAsync(this.dir + "/" + this.pfx + sid + this.sfx, 'utf8');

							case 6:
								data = _context.sent;

								if (data) {
									sess.data = JSON.parse(data);
								}
								sess.id = sid;
								_context.next = 13;
								break;

							case 11:
								_context.prev = 11;
								_context.t0 = _context["catch"](3);

							case 13:
								return _context.abrupt("return", sess);

							case 14:
							case "end":
								return _context.stop();
						}
					}
				}, _callee, this, [[3, 11]]);
			}));

			function get(_x) {
				return _ref.apply(this, arguments);
			}

			return get;
		}()
	}, {
		key: "set",
		value: function () {
			var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(sid, data) {
				return regeneratorRuntime.wrap(function _callee2$(_context2) {
					while (1) {
						switch (_context2.prev = _context2.next) {
							case 0:
								if (sid) {
									_context2.next = 4;
									break;
								}

								_context2.next = 3;
								return this.makeId(this.sidLength);

							case 3:
								sid = _context2.sent;

							case 4:
								_context2.prev = 4;
								_context2.next = 7;
								return fs.writeFileAsync(this.dir + "/" + this.pfx + sid + this.sfx, JSON.stringify(data), 'utf8');

							case 7:
								_context2.next = 12;
								break;

							case 9:
								_context2.prev = 9;
								_context2.t0 = _context2["catch"](4);
								throw _context2.t0;

							case 12:
								return _context2.abrupt("return", sid);

							case 13:
							case "end":
								return _context2.stop();
						}
					}
				}, _callee2, this, [[4, 9]]);
			}));

			function set(_x2, _x3) {
				return _ref2.apply(this, arguments);
			}

			return set;
		}()

		// given a session identifier, destroy a session

	}, {
		key: "destroy",
		value: function () {
			var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(sid) {
				return regeneratorRuntime.wrap(function _callee3$(_context3) {
					while (1) {
						switch (_context3.prev = _context3.next) {
							case 0:
								_context3.prev = 0;
								_context3.next = 3;
								return fs.unlinkAsync(this.dir + "/" + this.pfx + sid + this.sfx);

							case 3:
								return _context3.abrupt("return", _context3.sent);

							case 6:
								_context3.prev = 6;
								_context3.t0 = _context3["catch"](0);

								if (_context3.t0.code != "ENOENT") {
									console.log('unable to delete session file', _context3.t0);
								}

							case 9:
							case "end":
								return _context3.stop();
						}
					}
				}, _callee3, this, [[0, 6]]);
			}));

			function destroy(_x4) {
				return _ref3.apply(this, arguments);
			}

			return destroy;
		}()

		// garbage collect written session data that is expired

	}, {
		key: "gc",
		value: function () {
			var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee5() {
				var _this = this;

				var files, now;
				return regeneratorRuntime.wrap(function _callee5$(_context5) {
					while (1) {
						switch (_context5.prev = _context5.next) {
							case 0:
								if (!(this.gcFrequency == 0)) {
									_context5.next = 2;
									break;
								}

								return _context5.abrupt("return");

							case 2:

								this.gcCounter++;

								if (!(this.gcCounter == this.gcFrequency)) {
									_context5.next = 16;
									break;
								}

								this.gcCounter = 0;

								// run garbage collection on expired sessions

								_context5.prev = 5;
								_context5.next = 8;
								return globAsync(this.dir + "/" + this.pfx + "*" + this.sfx, { nomount: true });

							case 8:
								files = _context5.sent;
								now = Date.now();


								files.forEach(function () {
									var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(f) {
										var s;
										return regeneratorRuntime.wrap(function _callee4$(_context4) {
											while (1) {
												switch (_context4.prev = _context4.next) {
													case 0:
														_context4.next = 2;
														return fs.statAsync(f);

													case 2:
														s = _context4.sent;

														if (!(now - s.ctime > _this.maxAge * 1000)) {
															_context4.next = 12;
															break;
														}

														_context4.prev = 4;
														_context4.next = 7;
														return fs.unlinkAsync(f);

													case 7:
														_context4.next = 12;
														break;

													case 9:
														_context4.prev = 9;
														_context4.t0 = _context4["catch"](4);

														console.log("unable to delete expired session file:", f);

													case 12:
													case "end":
														return _context4.stop();
												}
											}
										}, _callee4, _this, [[4, 9]]);
									}));

									return function (_x5) {
										return _ref5.apply(this, arguments);
									};
								}());
								_context5.next = 16;
								break;

							case 13:
								_context5.prev = 13;
								_context5.t0 = _context5["catch"](5);

								console.log('error while garbage collecting session', _context5.t0);

							case 16:
								return _context5.abrupt("return");

							case 17:
							case "end":
								return _context5.stop();
						}
					}
				}, _callee5, this, [[5, 13]]);
			}));

			function gc() {
				return _ref4.apply(this, arguments);
			}

			return gc;
		}()
	}, {
		key: "makeId",
		value: function () {
			var _ref6 = _asyncToGenerator(regeneratorRuntime.mark(function _callee6(strlen) {
				var blen, id;
				return regeneratorRuntime.wrap(function _callee6$(_context6) {
					while (1) {
						switch (_context6.prev = _context6.next) {
							case 0:
								// compute the byte length we need to get the right string length we asked for
								blen = Math.ceil(3 * strlen / 4);

								// add +1 byte to make sure we eat the padding (which we probably don't need)
								// I'm too lazzy to figure this out exactly right now - TODO

								_context6.next = 3;
								return uid(blen + 1);

							case 3:
								id = _context6.sent;


								// trim to correct length
								id = id.substr(0, strlen);

								return _context6.abrupt("return", id);

							case 6:
							case "end":
								return _context6.stop();
						}
					}
				}, _callee6, this);
			}));

			function makeId(_x6) {
				return _ref6.apply(this, arguments);
			}

			return makeId;
		}()
	}]);

	return FileStore;
}();

module.exports = FileStore;