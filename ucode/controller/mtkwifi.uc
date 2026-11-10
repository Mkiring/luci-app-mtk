// Native ucode endpoints for the MT7628 vendor driver LuCI app.
// Reads/writes /etc/wireless/mt7628/mt7628.dat and drives /sbin/wifi-mtk.

'use strict';

import { readfile, writefile, popen } from 'fs';

const PROFILE_PATH = '/etc/wireless/mt7628/mt7628.dat';
const WIFIMTK = '/sbin/wifi-mtk';

// keys the web UI is allowed to modify
const ALLOWED = [
	/^SSID[1-4]$/,
	/^WPAPSK[1-4]$/,
	/^Key[1-4]Str[1-4]$/,
	/^WEP[1-4]Type[1-4]$/,
	/^RADIUS_(Server|Port|Key)[1-4]?$/,
	/^RekeyInterval$/,
	/^PMKCachePeriod$/,
	/^(AuthMode|EncrypType|DefaultKeyID|IEEE8021X|PreAuth)$/,
	/^(HideSSID|NoForwarding|WmmCapable|APSDCapable)$/,
	/^(Channel|ChannelList|AutoChannelSelect|WirelessMode|TxRate|TxPower)$/,
	/^(CountryCode|CountryRegion|CountryRegionABand)$/,
	/^(HT_BW|HT_GI|HT_STBC|HT_RDG|HT_AMSDU|HT_AutoBA|HT_PROTECT|HT_BSSCoexistence|HT_DisallowTKIP)$/,
	/^(BeaconPeriod|DtimPeriod|RTSThreshold|FragThreshold|TxBurst|PktAggregate|BgProtection|TxPreamble)$/,
	/^(BssidNum|MaxStaNum|ApCliEnable|ApCliSsid|ApCliAuthMode|ApCliEncrypType|ApCliWPAPSK)$/
];

function allowed_key(key) {
	for (let re in ALLOWED)
		if (match(key, re))
			return true;

	return false;
}

function load_profile() {
	let cfg = {};

	for (let line in split(readfile(PROFILE_PATH) ?? '', '\n')) {
		line = trim(line);

		if (!length(line) || substr(line, 0, 1) == '#')
			continue;

		let pos = index(line, '=');

		if (pos > 0)
			cfg[substr(line, 0, pos)] = substr(line, pos + 1);
	}

	return cfg;
}

function save_profile(vals) {
	let raw = readfile(PROFILE_PATH);
	let lines = (raw != null && length(raw)) ? split(raw, '\n') : [ 'Default' ];
	let pending = {}, out = [];

	for (let key, val in vals)
		pending[key] = `${val}`;

	for (let line in lines) {
		let t = trim(line);
		let pos = index(t, '=');
		let key = (pos > 0) ? substr(t, 0, pos) : null;

		if (key && key in pending) {
			push(out, `${key}=${pending[key]}`);
			delete pending[key];
		}
		else {
			/* keep comments and structural lines (e.g. the leading "Default") */
			push(out, line);
		}
	}

	for (let key, val in pending)
		push(out, `${key}=${val}`);

	writefile(PROFILE_PATH, join('\n', out) + '\n');
}

function action_dat_get() {
	http.prepare_content('application/json');
	http.write_json(load_profile());
}

function action_dat_set() {
	let raw = http.formvalue('data');
	let vals = null;

	if (type(raw) == 'string' && length(raw)) {
		let parsed = json(raw);

		if (type(parsed) == 'object')
			vals = parsed;
	}
	else if (type(raw) == 'object') {
		vals = raw;
	}

	if (!vals) {
		http.prepare_content('application/json');
		http.write_json({ status: 'error', message: 'invalid request' });
		return;
	}

	let rejected = [], accepted = {};

	for (let key, val in vals) {
		if (allowed_key(key) && type(val) in [ 'string', 'int', 'bool' ])
			accepted[key] = `${val}`;
		else
			push(rejected, key);
	}

	save_profile(accepted);

	http.prepare_content('application/json');
	http.write_json({
		status: length(rejected) ? 'partial' : 'ok',
		updated: keys(accepted),
		rejected: rejected
	});
}

function action_wifi_reload() {
	let res;

	try {
		res = call_wifimtk('restart');
	}
	catch (e) {
		res = { status: 'error', output: 'exception: ' + e };
	}

	http.prepare_content('application/json');
	http.write_json(res);
}

function call_wifimtk(cmd) {
	let fd = popen(`${WIFIMTK} ${cmd} 2>&1`, 'r');

	if (!fd)
		return { status: 'error', output: 'popen failed' };

	let output = fd.read('all');
	let rc = fd.close();

	return {
		status: (rc == 0) ? 'ok' : 'error',
		exit: rc,
		command: `${WIFIMTK} ${cmd}`,
		output: output ?? ''
	};
}

return {
	action_dat_get: action_dat_get,
	action_dat_set: action_dat_set,
	action_wifi_reload: action_wifi_reload
};
