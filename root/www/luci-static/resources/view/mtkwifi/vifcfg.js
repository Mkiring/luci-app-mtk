'use strict';
/* MT7628 AP interface (ra0) configuration, rewritten as a native LuCI view. */

'require ui';

return L.view.extend({
	title: _('MTK WiFi - Interface Configuration'),

	load: function() {
		return L.resolveDefault(L.Request.get(L.url('admin/mtk/wifi/dat_get')), null)
			.then(function(r) {
				try { return r.json(); } catch (e) { return null; }
			});
	},

	render: function(dat) {
		if (!dat)
			return E('p', { 'class': 'alert-message warning' },
				_('Failed to read /etc/wireless/mt7628/mt7628.dat. Is the driver package installed?'));

		var self = this;

		var authModes = [
			[ 'Disable',      _('Disable (open)') ],
			[ 'OPEN',         _('OPEN') ],
			[ 'WPA2PSK',      _('WPA2-PSK') ],
			[ 'WPAPSKWPA2PSK', _('WPA/WPA2-PSK mixed') ]
		];

		var encTypes = [ 'AES', 'TKIPAES' ];

		var authSel = new ui.Dropdown(dat.AuthMode || 'WPA2PSK', authModes, { sort: false, optional: false });
		var encSel  = new ui.Dropdown(dat.EncrypType || 'AES',
			encTypes.map(function(v) { return [ v, v ]; }), { sort: false, optional: false });
		var ssidInput = E('input', { 'class': 'cbi-input-text', 'value': dat.SSID1 || '',
			'maxlength': 32, 'placeholder': 'OpenWrt' });
		var pskInput = E('input', { 'class': 'cbi-input-text', 'value': dat.WPAPSK1 || '',
			'maxlength': 63, 'type': 'password' });
		var hideChk  = E('input', { 'class': 'cbi-input-checkbox', 'type': 'checkbox' });
		var isoChk   = E('input', { 'class': 'cbi-input-checkbox', 'type': 'checkbox' });
		var wmmChk   = E('input', { 'class': 'cbi-input-checkbox', 'type': 'checkbox' });
		var rekeyInput = E('input', { 'class': 'cbi-input-text', 'value': dat.RekeyInterval || '3600',
			'type': 'number', 'min': 0, 'max': 4194303 });

		if ((dat.HideSSID || '0') == '1') hideChk.checked = true;
		if ((dat.NoForwarding || '0') == '1') isoChk.checked = true;
		if ((dat.WmmCapable || '1') == '1') wmmChk.checked = true;

		var pskRow, rekeyRow, encRow;

		function authChanged() {
			var mode = authSel.getValue();
			var psk = (mode != 'Disable' && mode != 'OPEN');
			pskRow.style.display = psk ? '' : 'none';
			rekeyRow.style.display = psk ? '' : 'none';
			encRow.style.display = psk ? '' : 'none';
		}

		this.authSel = authSel;
		this.encSel = encSel;

		var saveBtn = E('button', {
			'class': 'cbi-button cbi-button-apply',
			'click': function(ev) {
				ev.preventDefault();
				self.handleSave();
			}
		}, _('Save and Apply'));

		var table = E('table', { 'class': 'table' }, [
			E('tr', {}, [ E('td', { 'width': '30%' }, _('SSID')), E('td', {}, ssidInput) ]),
			encRow = E('tr', {}, [ E('td', {}, _('Encryption')), E('td', {}, encSel.render()) ]),
			pskRow = E('tr', {}, [ E('td', {}, _('Key (WPA passphrase)')), E('td', {}, pskInput) ]),
			rekeyRow = E('tr', {}, [ E('td', {}, _('Key renewal interval (s)')), E('td', {}, rekeyInput) ]),
			E('tr', {}, [ E('td', {}, _('Hide SSID')), E('td', {}, hideChk) ]),
			E('tr', {}, [ E('td', {}, _('AP isolation')), E('td', {}, isoChk) ]),
			E('tr', {}, [ E('td', {}, _('WMM')), E('td', {}, wmmChk) ])
		]);

		var authTd = authSel.render();
		authTd.addEventListener('change', authChanged);
		/* re-run once dropdown widget is live */
		setTimeout(authChanged, 0);

		return E('div', { 'class': 'cbi-map', 'id': 'cbi-mtk-vif' }, [
			E('h2', {}, _('Interface Configuration - mt7628@ra0')),
			E('div', { 'class': 'cbi-section' }, [
				E('table', { 'class': 'table' }, [
					E('tr', {}, [ E('td', { 'width': '30%' }, _('Authentication')), E('td', {}, authTd) ])
				]),
				table
			]),
			E('div', { 'class': 'cbi-page-actions' }, [ saveBtn ])
		]);
	},

	handleSave: function() {
		var ssid = document.querySelector('#cbi-mtk-vif input.cbi-input-text[maxlength="32"]').value.trim();
		var psk  = document.querySelector('#cbi-mtk-vif input[type="password"]').value;

		if (!ssid || ssid.length > 32)
			return ui.showModal(_('Error'), [ E('p', {}, _('Invalid SSID (1-32 characters).')), ui.createInlineButton() ]);

		var mode = this.authSel.getValue();
		var needPsk = (mode != 'Disable' && mode != 'OPEN');

		if (needPsk && (psk.length < 8 || psk.length > 63))
			return ui.showModal(_('Error'), [ E('p', {}, _('WPA key must be 8-63 characters.')), ui.createInlineButton() ]);

		var vals = {
			SSID1: ssid,
			AuthMode: mode,
			HideSSID: document.querySelector('#cbi-mtk-vif input[type="checkbox"]').checked ? '1' : '0'
		};

		var boxes = document.querySelectorAll('#cbi-mtk-vif input[type="checkbox"]');
		vals.HideSSID = boxes[0].checked ? '1' : '0';
		vals.NoForwarding = boxes[1].checked ? '1' : '0';
		vals.WmmCapable = boxes[2].checked ? '1' : '0';

		if (needPsk) {
			vals.EncrypType = this.encSel.getValue();
			vals.WPAPSK1 = psk;
			vals.RekeyMethod = 'TIME';
			vals.RekeyInterval = document.querySelector('#cbi-mtk-vif input[type="number"]').value || '3600';
		}
		else {
			vals.EncrypType = 'NONE';
			vals.WPAPSK1 = '';
		}

		ui.showModal(_('Applying settings…'), [ E('p', { 'class': 'spinning' }, _('Saving profile and restarting WiFi…')) ]);

		L.Request.post(L.url('admin/mtk/wifi/dat_set'), { data: JSON.stringify(vals), token: L.env.token })
			.then(function(r) { return r.json(); })
			.then(function(j) {
				if (j.status == 'error')
					throw j.message || 'save failed';

				return L.Request.post(L.url('admin/mtk/wifi/wifi_reload'), { token: L.env.token })
					.then(function() { return true; });
			})
			.then(function() {
				ui.showModal(_('Success'), [
					E('p', {}, _('Settings applied. WiFi is restarting, this page will reload in 5 seconds.')),
					E('button', { 'class': 'cbi-button', 'click': function() { location.reload(); } }, _('Reload now'))
				]);
				setTimeout(function() { location.reload(); }, 5000);
			})
			.catch(function(err) {
				ui.showModal(_('Error'), [ E('p', {}, _('Failed: ') + err), ui.createInlineButton() ]);
			});
	}
});
