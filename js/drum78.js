function SeqDrum78(engine, container) {
	var self = this;

	self.ID = "Drum78"; // needs to be a singleton I guess? maybe add an incrementer or something.

	self.MasterGain = engine.context.createGain();
	self.MasterGain.gain.value = .87;
	self.MasterGain.connect(engine.Bus.Input);

	self.LoadSequence = function(sequence) {
		if (sequence.instrument == self.ID) {
			$(".drummachine-lane > .note").data("on", 0);
			for (var i = 0; i < sequence.length; i++) {
				switch (sequence[i].what) {
					case SeqDrumSound.BD:
						$($("#drummachine-sequencer-bd > .note")[sequence[i].when - 1]).data("on", sequence[i].when);
						$($("#drummachine-sequencer-bd > .note")[sequence[i].when - 1]).css("background-color", ColorRed);
						break;
					case SeqDrumSound.SD:
						$($("#drummachine-sequencer-sd > .note")[sequence[i].when - 1]).data("on", sequence[i].when);
						$($("#drummachine-sequencer-sd > .note")[sequence[i].when - 1]).css("background-color", ColorRed);
						break;
					case SeqDrumSound.CH:
						$($("#drummachine-sequencer-ch > .note")[sequence[i].when - 1]).data("on", sequence[i].when);
						$($("#drummachine-sequencer-ch > .note")[sequence[i].when - 1]).css("background-color", ColorRed);
						break;
					case SeqDrumSound.OH:
						$($("#drummachine-sequencer-oh > .note")[sequence[i].when - 1]).data("on", sequence[i].when);
						$($("#drummachine-sequencer-oh > .note")[sequence[i].when - 1]).css("background-color", ColorRed);
						break;
					default:
						console.log("Unexpected drum sound: " + sequence[i].what.toString());
				}
			}
		}
	};



	self.Off = function() {
		self.BD.Off();
		self.SD.Off();
		self.CH.Off();
	}

	self.BD = { Gain: engine.context.createGain() };
	self.SD = { Gain: engine.context.createGain() };
	self.CH = { Gain: engine.context.createGain() };
	self.OH = { Gain: engine.context.createGain() };

	self.BD.Gain.connect(self.MasterGain);
	self.SD.Gain.connect(self.MasterGain);
	self.OH.Gain.connect(self.MasterGain);
	self.CH.Gain.connect(self.MasterGain);

	self.BD.Gain.gain.value = 1;
	self.SD.Gain.gain.value = .44;
	self.CH.Gain.gain.value = .38;
	self.OH.Gain.gain.value = .84;

	//BD
	var bdEnv = engine.context.createGain();
	bdEnv.gain.value = 0;
	bdEnv.connect(self.BD.Gain);

	var bdLP = engine.context.createBiquadFilter();
	bdLP.frequency.value = 100;
	bdLP.Q.value = 0;
	bdLP.connect(bdEnv);

	var bdOsc1 = engine.context.createOscillator();
	bdOsc1.frequency.value = 65;
	bdOsc1.connect(bdEnv);
	bdOsc1.start(0);

	var bdOsc2 = engine.context.createOscillator();
	bdOsc2.type = "square";
	bdOsc2.frequency.value = 65;
	bdOsc2.connect(bdLP);
	bdOsc2.start(0);

	self.BD.Trigger = function(at) {
		bdEnv.gain.setTargetAtTime(1, at, .01);
		bdEnv.gain.setTargetAtTime(0, at + .05, .03);
	};

	self.BD.Off = function() {
		bdEnv.gain.cancelScheduledValues(0);
		bdEnv.gain.value = 0;
	}

	//SD
	var sdGate = engine.context.createGain();
	sdGate.gain.value = 0;
	sdGate.connect(self.SD.Gain);

	var sdWNEnv = engine.context.createGain();
	sdWNEnv.connect(sdGate);
	sdWNEnv.gain.value = 0;

	var sdOsc1Env = engine.context.createGain();
	sdOsc1Env.connect(self.SD.Gain);
	sdOsc1Env.gain.value = 0;

	var sdOsc2Env = engine.context.createGain();
	sdOsc2Env.connect(self.SD.Gain);
	sdOsc2Env.gain.value = 0;

	var sdHP = engine.context.createBiquadFilter();
	sdHP.type = "highpass";
	sdHP.frequency.value = 10000;
	sdHP.connect(sdGate);

	var sdLP = engine.context.createBiquadFilter();
	sdLP.type = "lowpass";
	sdLP.frequency.value = 8000;
	sdLP.connect(sdHP);
	sdLP.connect(sdWNEnv);

	// borrowed from https://developer.tizen.org/documentation/articles/advanced-web-audio-api-usage
	var whiteNoiseBuffer = engine.context.createBuffer(1, 44100, 44100);
	var data = whiteNoiseBuffer.getChannelData(0);
	for (var i = 0; i < data.length; i++) {
		data[i] = (Math.random() - 0.5) * 2;
	}

	var whiteNoise = engine.context.createBufferSource();
	whiteNoise.loop = true;
	whiteNoise.buffer = whiteNoiseBuffer;
	whiteNoise.connect(sdLP);
	whiteNoise.start(0);

	var sdOsc1 = engine.context.createOscillator();
	sdOsc1.type = "sine";
	sdOsc1.connect(sdOsc1Env);
	sdOsc1.frequency.value = 330;
	sdOsc1.start(0);

	var sdOsc2 = engine.context.createOscillator();
	sdOsc2.type = "sine";
	sdOsc2.connect(sdOsc2Env);
	sdOsc2.frequency.value = 180;
	sdOsc2.start(0);

	self.SD.Trigger = function(at) {
		sdGate.gain.setTargetAtTime(.5, at, 0);
		sdGate.gain.setTargetAtTime(0, at + .03, .03);

		sdOsc1Env.gain.setTargetAtTime(.25, at, 0);
		sdOsc1Env.gain.setTargetAtTime(0, at + .03, .03);

		sdOsc2Env.gain.setTargetAtTime(.25, at, 0);
		sdOsc2Env.gain.setTargetAtTime(0, at + .03, .03);
	};

	self.SD.Off = function() {
		sdGate.gain.cancelScheduledValues(0);
		sdOsc1Env.gain.cancelScheduledValues(0);
		sdOsc2Env.gain.cancelScheduledValues(0);

		sdGate.gain.value = 0;	
		sdOsc1Env.gain.value = 0;	
		sdOsc2Env.gain.value = 0;	
	}

	var ohGate = engine.context.createGain();
	ohGate.gain.value = 0;
	ohGate.connect(self.OH.Gain);

	var chGate = engine.context.createGain();
	chGate.gain.value = 0;
	chGate.connect(self.CH.Gain);

	//CH
	var chHP = engine.context.createBiquadFilter();
	chHP.connect(chGate);
	chHP.connect(ohGate);
	chHP.type = "highpass";
	chHP.frequency.value = 10000;

	// high bandpass
	var chHGain1 = engine.context.createGain();
	chHGain1.connect(chHP);
	chHGain1.gain.value = 0;

	var chHGain2 = engine.context.createGain();
	chHGain2.connect(chHP);
	chHGain2.gain.value = 0;

	var chHBP = engine.context.createBiquadFilter();
	chHBP.type = "bandpass";
	chHBP.frequency.value = 7000;
	chHBP.Q.value = 12;
	chHBP.connect(chHGain1);
	chHBP.connect(chHGain2);

	// low bandpass
	var chLBGain = engine.context.createGain();
	chLBGain.connect(chHP);
	chLBGain.gain.value = 0;

	var chLBP = engine.context.createBiquadFilter();
	chLBP.type = "bandpass";
	chLBP.frequency.value = 3500;
	chLBP.Q.value = 12;
	chLBP.connect(chLBGain);

	var chOsc1 = engine.context.createOscillator();
	chOsc1.type = "square";
	chOsc1.frequency.value = 303;
	chOsc1.connect(chLBP);
	chOsc1.connect(chHBP);
	chOsc1.start(0);

	var chOsc2 = engine.context.createOscillator();
	chOsc2.type = "square";
	chOsc2.frequency.value = 176;
	chOsc2.connect(chLBP);
	chOsc2.connect(chHBP);
	chOsc2.start(0);

	var chOsc3 = engine.context.createOscillator();
	chOsc3.type = "square";
	chOsc3.frequency.value = 214;
	chOsc3.connect(chLBP);
	chOsc3.connect(chHBP);
	chOsc3.start(0);

	var chOsc4 = engine.context.createOscillator();
	chOsc4.type = "square";
	chOsc4.frequency.value = 119;
	chOsc4.connect(chLBP);
	chOsc4.connect(chHBP);
	chOsc4.start(0);

	var chOsc5 = engine.context.createOscillator();
	chOsc5.type = "square";
	chOsc5.frequency.value = 540;
	chOsc5.connect(chLBP);
	chOsc5.connect(chHBP);
	chOsc5.start(0);

	var chOsc6 = engine.context.createOscillator();
	chOsc6.type = "square";
	chOsc6.frequency.value = 800;
	chOsc6.connect(chLBP);
	chOsc6.connect(chHBP);
	chOsc6.start(0);

	self.CH.Trigger = function(at) {
		ohGate.gain.value = 0; // silence open hat
		chGate.gain.value = 1; // open closed hat gate 

		chHGain1.gain.setTargetAtTime(1 / 3, at, 0);
		chHGain1.gain.setTargetAtTime(0, at + .01, .01);

		chHGain2.gain.setTargetAtTime(1 / 3, at, 0);
		chHGain2.gain.setTargetAtTime(0, at + .02, .01);

		chLBGain.gain.setTargetAtTime(1 / 3, at, 0);
		chLBGain.gain.setTargetAtTime(0, at + .02, .01);
	};

	self.OH.Trigger = function(at) {
		chGate.gain.value = 0; // silence closed hat
		ohGate.gain.value = 1; // open open hat gate

		chHGain1.gain.setTargetAtTime(1 / 3, at, 0);
		chHGain1.gain.setTargetAtTime(0, at + .5, 1);

		chHGain2.gain.setTargetAtTime(1 / 3, at, 0);
		chHGain2.gain.setTargetAtTime(0, at + .5, 1);

		chLBGain.gain.setTargetAtTime(1 / 3, at, 0);
		chLBGain.gain.setTargetAtTime(0, at + .5, 1);
	};

	self.CH.Off = function() {
		chHGain1.gain.cancelScheduledValues(0);
		chHGain2.gain.cancelScheduledValues(0);
		chLBGain.gain.cancelScheduledValues(0);

		chHGain1.gain.value = 0;
		chHGain2.gain.value = 0;
		chLBGain.gain.value = 0;
	};

	self.Draw = function() {
		// draw self
		var html = '<table id="drummachine-controls"> ' +
			'<tr> ' +
			'	<td colspan="2" id="drummachine-name" style="text-align: right;">drum-78</td>' +
			'	</tr>' +
			'	<tr>' +
			'		<td>bass</td>' +
			'		<td>snare</td>' +
			'	</tr>' +
			'	<tr>' +
			'		<td><input id="drummachine-bd-gain" type="text"></td>' +
			'		<td><input id="drummachine-sd-gain" type="text"></td>' +
			'	</tr>' +
			'	<tr>' +
			'		<td>closed hh</td>' +
			'		<td>open hh</td>' +
			'	</tr>' +
			'	<tr>' +
			'		<td><input id="drummachine-ch-gain" type="text"></td>' +
			'		<td><input id="drummachine-oh-gain" type="text"></td>' +
			'	</tr>' +
			'</table>' +
			'<table id="drummachine-sequencer">' +
			'	<tr class="drummachine-lane" id="drummachine-sequencer-oh">' +
			'		<td class="drummachine-sequencer-label">OH</td>' +
			'	</tr>' +
			'	<tr class="drummachine-lane" id="drummachine-sequencer-ch">' +
			'		<td class="drummachine-sequencer-label">CH</td>' +
			'	</tr>' +
			'	<tr class="drummachine-lane" id="drummachine-sequencer-sd">' +
			'		<td class="drummachine-sequencer-label">SD</td>' +
			'	</tr>' +

			'	<tr class="drummachine-lane" id="drummachine-sequencer-bd">' +
			'		<td class="drummachine-sequencer-label">BD</td>' +
			'	</tr>' +
			'</table>';

		container.append(html);

		var control_knob_width = 50;
		var control_knob_height = 50;

		var oh = container.find("#drummachine-sequencer-oh"); // these ids won't work with multiple machines
		var ch = container.find("#drummachine-sequencer-ch"); // these ids won't work with multiple machines
		var sd = container.find("#drummachine-sequencer-sd"); // these ids won't work with multiple machines
		var bd = container.find("#drummachine-sequencer-bd"); // these ids won't work with multiple machines

		for (var i = 0; i < 32; i++) {
			$('<td class="note">&nbsp;&nbsp;</td>').data("note", self.OH).appendTo(oh);
			$('<td class="note">&nbsp;&nbsp;</td>').data("note", self.CH).appendTo(ch);
			$('<td class="note">&nbsp;&nbsp;</td>').data("note", self.SD).appendTo(sd);
			$('<td class="note">&nbsp;&nbsp;</td>').data("note", self.BD).appendTo(bd);
		}

		container.find("#drummachine-bd-gain").val(self.BD.Gain.gain.value * 100).knob({
			"width": control_knob_width,
			"height": control_knob_height,
			"min": 0,
			"max": 100,
			"fgColor": "orange",
			"bgColor": "rgb(200,200,200)",
			"inputColor": "white",
			"font": "monospace",
			"change": function(v) { self.BD.Gain.gain.value = v / 100; }
		});

		container.find("#drummachine-sd-gain").val(self.SD.Gain.gain.value * 100).knob({
			"width": control_knob_width,
			"height": control_knob_height,
			"min": 0,
			"max": 100,
			"fgColor": "orange",
			"bgColor": "rgb(200,200,200)",
			"inputColor": "white",
			"font": "monospace",
			"change": function(v) { self.SD.Gain.gain.value = v / 100; }
		});

		container.find("#drummachine-oh-gain").val(self.OH.Gain.gain.value * 100).knob({
			"width": control_knob_width,
			"height": control_knob_height,
			"min": 0,
			"max": 100,
			"fgColor": "orange",
			"bgColor": "rgb(200,200,200)",
			"inputColor": "white",
			"font": "monospace",
			"change": function(v) { self.OH.Gain.gain.value = v / 100; }
		});

		container.find("#drummachine-ch-gain").val(self.CH.Gain.gain.value * 100).knob({
			"width": control_knob_width,
			"height": control_knob_height,
			"min": 0,
			"max": 100,
			"fgColor": "orange",
			"bgColor": "rgb(200,200,200)",
			"inputColor": "white",
			"font": "monospace",
			"change": function(v) { self.CH.Gain.gain.value = v / 100; }
		});
	}
}
