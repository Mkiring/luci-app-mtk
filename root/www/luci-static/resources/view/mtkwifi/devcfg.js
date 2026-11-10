'use strict';
/* MT7628 radio (device) configuration, rewritten as a native LuCI view. */

'require ui';

return L.view.extend({
	title: _('MTK WiFi - Device Configuration'),

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

		var channels = [ [ '0', _('Auto') ] ];
		for (var ch = 1; ch <= 13; ch++)
			channels.push([ '' + ch, '' + ch + ' (' + (2412 + (ch - 1) * 5) + ' MHz)' ]);

		var modes = [
			[ '9', _('802.11b/g/n mixed') ],
			[ '4', _('802.11b/g') ],
			[ '1', _('802.11b only') ]
		];

		var countries = [
			[ 'CN', 'CN (China)' ],
			[ 'US', 'US' ],
			[ 'EU', 'EU' ],
			[ 'TW', 'TW' ],
			[ '00', _('World (00)') ]
		];

		this.chSel = new ui.Dropdown(dat.Channel || '0', channels, { sort: false });
		this.modeSel = new ui.Dropdown(dat.WirelessMode || '9', modes, { sort: false });
		this.ctrySel = new ui.Dropdown(dat.CountryCode || 'CN', countries, { sort: false });
		this.bwSel = new ui.Dropdown(dat.HT_BW || '0',
			[ [ '0', _('20 MHz') ], [ '1', _('40 MHz') ] ], { sort: false });
		this.giSel = new ui.Dropdown(dat.HT_GI || '1',
			[ [ '0', _('Long GI') ], [ '1', _('Short GI') ] ], { sort: false });

		this.pwrInput = E('input', { 'class': 'cbi-input-text', 'type': 'number',
			'min': 1, 'max': 100, 'value': dat.TxPower || '100' });
		this.beaconInput = E('input', { 'class': 'cbi-input-text', 'type': 'number',
			'min': 20, 'max': 999, 'value': dat.BeaconPeriod || '100' });
		this.dtimInput = E('input', { 'class': 'cbi-input-text', 'type': 'number',
			'min': 1, 'max': 255, 'value': dat.DtimPeriod || '1' });

		function row(label, widget) {
			return E('tr', {}, [ E('td', { 'width': '30%' }, label), E('td', {}, widget) ]);
		}

		var saveBtn = E('button', {
			'class': 'cbi-button cbi-button-apply',
			'click': function(ev) {
				ev.preventDefault();
				self.handleSave();
			}
		}, _('Save and Apply'));

		return E('div', { 'class': 'cbi-map', 'id': 'cbi-mtk-dev' }, [
			E('h2', {}, _('Device Configuration - mt7628 (2.4 GHz)')),
			E('div', { 'class': 'cbi-section' }, [
				E('table', { 'class': 'table' }, [
					row(_('Channel'), this.chSel.render()),
					row(_('Wireless mode'), this.modeSel.render()),
					row(_('Country code'), this.ctrySel.render()),
					row(_('Channel bandwidth'), this.bwSel.render()),
					row(_('Guard interval'), this.giSel.render()),
					row(_('TX power (%)'), this.pwrInput),
					row(_('Beacon interval (ms)'), this.beaconInput),
					row(_('DTIM interval'), this.dtimInput)
				])
			]),
			E('div', { 'class': 'cbi-page-actions' }, [ saveBtn ])
		]);
	},

	handleSave: function() {
		var vals = {
			Channel: this.chSel.getValue(),
			WirelessMode: this.modeSel.getValue(),
			CountryCode: this.ctrySel.getValue(),
			HT_BW: this.bwSel.getValue(),
			HT_GI: this.giSel.getValue(),
			TxPower: this.pwrInput.value || '100',
			BeaconPeriod: this.beaconInput.value || '100',
			DtimPeriod: this.dtimInput.value || '1'
		};

		if (vals.Channel == '0') {
			vals.AutoChannelSelect = '2'; /* SelectChannelByRSSI */
		}
		else {
			vals.AutoChannelSelect = '0';
		}

		ui.showModal(_('Applying settings…'), [ E('p', { 'class': 'spinning' }, _('Saving profile and restarting WiFi…')) ]);

		var fd = new FormData();
			fd.append('data', JSON.stringify(vals));

			L.Request.post(L.url('admin/mtk/wifi/dat_set', { token: L.env.token }), fd)
			.then(function(r) { return r.json(); })
			.then(function(j) {
				if (j.status == 'error')
					throw j.message || 'save failed';

				return L.Request.post(L.url('admin/mtk/wifi/wifi_reload', { token: L.env.token }), new FormData())
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
