ColorRed = "rgb(220, 50, 47)";
ColorOrange = "rgb(203, 75, 22)";
ColorBase1 = "rgb(147, 161, 161)";
ColorWhite = "rgb(255, 255, 255)";
ColorBase2 = "rgb(238, 232, 213)";

var SeqDrumSound = {
	BD: "BD",
	SD: "SD",
	CH: "CH",
	OH: "OH",
};

var SeqInstruments = {
	Drum78: 0,
	BluePlanet: 1,
	Bassline: 2,
}

function freqFromCanonical(canonical) {
	switch(canonical) {
		case "A":
			return 220;
		case "A#":
			return 233.1;
		case "B":
			return 246.9;
		case "C":
			return 130.8;
		case "C#":
			return 138.6;
		case "D":
			return 146.8;
		case "D#":
			return 155.6;
		case "E":
			return 164.8;
		case "E2":
			return 164.8 * 2;
		case "F":
			return 174.6;
		case "F#":
			return 185;
		case "G":
			return 195;
		case "G#":
			return 207.7;

		default:
			return 0;
	}

	return 0;
}

Engine = function(context) {
	var self = this;
	self.Tempo = 100;

	this.Bus = {
		Comp: context.createDynamicsCompressor(),
		HighPass: context.createBiquadFilter(),
		Peaking: context.createBiquadFilter(),
		LowPass: context.createBiquadFilter(),
	};


	this.Bus.HighPass.type = "highpass";
	this.Bus.HighPass.frequency.value = 80;

	this.Bus.Peaking.type = "peaking";
	this.Bus.Peaking.frequency.value = 8000;
	this.Bus.Peaking.gain.value = 2;

	this.Bus.LowPass.type = "lowpass";
	this.Bus.LowPass.frequency.value = 20000;

	this.Bus.Comp.threshold = -40;
	this.Bus.Comp.ratio.value = 8;
	this.Bus.Comp.attack.value = .09;
	this.Bus.Comp.release.value = .4;

	this.Bus.Input = this.Bus.HighPass;

	this.Bus.Comp.connect(context.destination);
	this.Bus.LowPass.connect(this.Bus.Comp);
	this.Bus.Peaking.connect(this.Bus.LowPass);
	this.Bus.HighPass.connect(this.Bus.Peaking);

	var bus = this.Bus;

	this.DrumMachine = {
		MasterGain: context.createGain(),
		LoadSequence: function(sequence) {
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
		},
	};

	this.DrumMachine.MasterGain.gain.value = .87;
	this.DrumMachine.MasterGain.connect(bus.Input);

	var drummachine = this.DrumMachine;
	drummachine.Off = function() {
		drummachine.BD.Off();
		drummachine.SD.Off();
		drummachine.CH.Off();
	}

	this.DrumMachine.BD = { Gain: context.createGain() };
	this.DrumMachine.SD = { Gain: context.createGain() };
	this.DrumMachine.CH = { Gain: context.createGain() };
	this.DrumMachine.OH = { Gain: context.createGain() };

	this.DrumMachine.BD.Gain.connect(this.DrumMachine.MasterGain);
	this.DrumMachine.SD.Gain.connect(this.DrumMachine.MasterGain);
	this.DrumMachine.OH.Gain.connect(this.DrumMachine.MasterGain);
	this.DrumMachine.CH.Gain.connect(this.DrumMachine.MasterGain);

	this.DrumMachine.BD.Gain.gain.value = 1;
	this.DrumMachine.SD.Gain.gain.value = .44;
	this.DrumMachine.CH.Gain.gain.value = .38;
	this.DrumMachine.OH.Gain.gain.value = .84;

	//BD
	var bdEnv = context.createGain();
	bdEnv.gain.value = 0;
	bdEnv.connect(this.DrumMachine.BD.Gain);

	var bdLP = context.createBiquadFilter();
	bdLP.frequency.value = 100;
	bdLP.Q.value = 0;
	bdLP.connect(bdEnv);

	var bdOsc1 = context.createOscillator();
	bdOsc1.frequency.value = 65;
	bdOsc1.connect(bdEnv);
	bdOsc1.start(0);

	var bdOsc2 = context.createOscillator();
	bdOsc2.type = "square";
	bdOsc2.frequency.value = 65;
	bdOsc2.connect(bdLP);
	bdOsc2.start(0);

	this.DrumMachine.BD.Trigger = function(at) {
		bdEnv.gain.setTargetAtTime(1, at, .01);
		bdEnv.gain.setTargetAtTime(0, at + .05, .03);
	};

	this.DrumMachine.BD.Off = function() {
		bdEnv.gain.cancelScheduledValues(0);
		bdEnv.gain.value = 0;
	}

	//SD
	var sdGate = context.createGain();
	sdGate.gain.value = 0;
	sdGate.connect(this.DrumMachine.SD.Gain);

	var sdWNEnv = context.createGain();
	sdWNEnv.connect(sdGate);
	sdWNEnv.gain.value = 0;

	var sdOsc1Env = context.createGain();
	sdOsc1Env.connect(this.DrumMachine.SD.Gain);
	sdOsc1Env.gain.value = 0;

	var sdOsc2Env = context.createGain();
	sdOsc2Env.connect(this.DrumMachine.SD.Gain);
	sdOsc2Env.gain.value = 0;

	var sdHP = context.createBiquadFilter();
	sdHP.type = "highpass";
	sdHP.frequency.value = 10000;
	sdHP.connect(sdGate);

	var sdLP = context.createBiquadFilter();
	sdLP.type = "lowpass";
	sdLP.frequency.value = 8000;
	sdLP.connect(sdHP);
	sdLP.connect(sdWNEnv);

	// borrowed from https://developer.tizen.org/documentation/articles/advanced-web-audio-api-usage
	var whiteNoiseBuffer = context.createBuffer(1, 44100, 44100);
	var data = whiteNoiseBuffer.getChannelData(0);
	for (var i = 0; i < data.length; i++) {
		data[i] = (Math.random() - 0.5) * 2;
	}

	var whiteNoise = context.createBufferSource();
	whiteNoise.loop = true;
	whiteNoise.buffer = whiteNoiseBuffer;
	whiteNoise.connect(sdLP);
	whiteNoise.start(0);

	var sdOsc1 = context.createOscillator();
	sdOsc1.type = "sine";
	sdOsc1.connect(sdOsc1Env);
	sdOsc1.frequency.value = 330;
	sdOsc1.start(0);

	var sdOsc2 = context.createOscillator();
	sdOsc2.type = "sine";
	sdOsc2.connect(sdOsc2Env);
	sdOsc2.frequency.value = 180;
	sdOsc2.start(0);

	var sd = this.DrumMachine.SD;
	this.DrumMachine.SD.Trigger = function(at) {
		sdGate.gain.setTargetAtTime(.5, at, 0);
		sdGate.gain.setTargetAtTime(0, at + .03, .03);

		sdOsc1Env.gain.setTargetAtTime(.25, at, 0);
		sdOsc1Env.gain.setTargetAtTime(0, at + .03, .03);

		sdOsc2Env.gain.setTargetAtTime(.25, at, 0);
		sdOsc2Env.gain.setTargetAtTime(0, at + .03, .03);
	};

	this.DrumMachine.SD.Off = function() {
		sdGate.gain.cancelScheduledValues(0);
		sdOsc1Env.gain.cancelScheduledValues(0);
		sdOsc2Env.gain.cancelScheduledValues(0);

		sdGate.gain.value = 0;	
		sdOsc1Env.gain.value = 0;	
		sdOsc2Env.gain.value = 0;	
	}

	var ohGate = context.createGain();
	ohGate.gain.value = 0;
	ohGate.connect(this.DrumMachine.OH.Gain);

	var chGate = context.createGain();
	chGate.gain.value = 0;
	chGate.connect(this.DrumMachine.CH.Gain);

	//CH
	var chHP = context.createBiquadFilter();
	chHP.connect(chGate);
	chHP.connect(ohGate);
	chHP.type = "highpass";
	chHP.frequency.value = 10000;

	// high bandpass
	var chHGain1 = context.createGain();
	chHGain1.connect(chHP);
	chHGain1.gain.value = 0;

	var chHGain2 = context.createGain();
	chHGain2.connect(chHP);
	chHGain2.gain.value = 0;

	var chHBP = context.createBiquadFilter();
	chHBP.type = "bandpass";
	chHBP.frequency.value = 7000;
	chHBP.Q.value = 12;
	chHBP.connect(chHGain1);
	chHBP.connect(chHGain2);

	// low bandpass
	var chLBGain = context.createGain();
	chLBGain.connect(chHP);
	chLBGain.gain.value = 0;

	var chLBP = context.createBiquadFilter();
	chLBP.type = "bandpass";
	chLBP.frequency.value = 3500;
	chLBP.Q.value = 12;
	chLBP.connect(chLBGain);

	var chOsc1 = context.createOscillator();
	chOsc1.type = "square";
	chOsc1.frequency.value = 303;
	chOsc1.connect(chLBP);
	chOsc1.connect(chHBP);
	chOsc1.start(0);

	var chOsc2 = context.createOscillator();
	chOsc2.type = "square";
	chOsc2.frequency.value = 176;
	chOsc2.connect(chLBP);
	chOsc2.connect(chHBP);
	chOsc2.start(0);

	var chOsc3 = context.createOscillator();
	chOsc3.type = "square";
	chOsc3.frequency.value = 214;
	chOsc3.connect(chLBP);
	chOsc3.connect(chHBP);
	chOsc3.start(0);

	var chOsc4 = context.createOscillator();
	chOsc4.type = "square";
	chOsc4.frequency.value = 119;
	chOsc4.connect(chLBP);
	chOsc4.connect(chHBP);
	chOsc4.start(0);

	var chOsc5 = context.createOscillator();
	chOsc5.type = "square";
	chOsc5.frequency.value = 540;
	chOsc5.connect(chLBP);
	chOsc5.connect(chHBP);
	chOsc5.start(0);

	var chOsc6 = context.createOscillator();
	chOsc6.type = "square";
	chOsc6.frequency.value = 800;
	chOsc6.connect(chLBP);
	chOsc6.connect(chHBP);
	chOsc6.start(0);

	var ch = this.DrumMachine.CH;
	var oh = this.DrumMachine.OH;
	this.DrumMachine.CH.Trigger = function(at) {
		ohGate.gain.value = 0; // silence open hat
		chGate.gain.value = 1; // open closed hat gate 

		chHGain1.gain.setTargetAtTime(1 / 3, at, 0);
		chHGain1.gain.setTargetAtTime(0, at + .01, .01);

		chHGain2.gain.setTargetAtTime(1 / 3, at, 0);
		chHGain2.gain.setTargetAtTime(0, at + .02, .01);

		chLBGain.gain.setTargetAtTime(1 / 3, at, 0);
		chLBGain.gain.setTargetAtTime(0, at + .02, .01);
	};

	this.DrumMachine.OH.Trigger = function(at) {
		chGate.gain.value = 0; // silence closed hat
		ohGate.gain.value = 1; // open open hat gate

		chHGain1.gain.setTargetAtTime(1 / 3, at, 0);
		chHGain1.gain.setTargetAtTime(0, at + .5, 1);

		chHGain2.gain.setTargetAtTime(1 / 3, at, 0);
		chHGain2.gain.setTargetAtTime(0, at + .5, 1);

		chLBGain.gain.setTargetAtTime(1 / 3, at, 0);
		chLBGain.gain.setTargetAtTime(0, at + .5, 1);
	};

	this.DrumMachine.CH.Off = function() {
		chHGain1.gain.cancelScheduledValues(0);
		chHGain2.gain.cancelScheduledValues(0);
		chLBGain.gain.cancelScheduledValues(0);

		chHGain1.gain.value = 0;
		chHGain2.gain.value = 0;
		chLBGain.gain.value = 0;
	};

	this.Bass = {
		LP: context.createBiquadFilter(),
		Osc: context.createOscillator(),
		Gain: context.createGain(),
		Attack: 7, // ms
		Decay: 300, // ms
	}

	var bass = this.Bass;

	bass.Gain.connect(bus.Input);
	bass.Gain.gain.value = .14;
	bass.LP.connect(this.Bass.Gain);

	bass.LP.frequency.value = 800;
	bass.LP.Q.value = 24;

	var bassEnv = context.createGain();
	bassEnv.connect(bass.LP);
	bassEnv.gain.value = 0;

	bass.Osc.connect(bassEnv);
	bass.Osc.type = "sawtooth";
	bass.Osc.start(0);

	bass.Off = function() {
		bassEnv.gain.cancelScheduledValues(0);
		bassEnv.gain.value = 0;
	}

	bass.Note = function(inputId) {
		this.Trigger = function(at) {
			var frequency = freqFromCanonical($("#" + inputId).val());
			bass.Osc.frequency.setTargetAtTime(frequency / 2, at, 0);
			bassEnv.gain.setTargetAtTime(1, at, bass.Attack / 1000);
			bassEnv.gain.setTargetAtTime(0, at + (bass.Attack / 1000), bass.Decay / 1000);
		}
	}

	var bassNoteHash = ["off", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E2"];
	bass.LoadSequence = function(sequence) {
		$(".bass-sequencer-lane > .note").data("on", 0);

		for (var i = 0; i < sequence.length; i++) {
			$("#bass-" + sequence[i].when).val(bassNoteHash.indexOf(sequence[i].what)).data("on", sequence[i].when).trigger("change");
		}
	}

	this.Poly = {
		LP: context.createBiquadFilter(),
		MasterGain: context.createGain(),
		Osc1Gain: context.createGain(),
		Osc2Gain: context.createGain(),
		Octave: 0,
		Attack: 60, // ms
		Decay: 130, // ms
		Sustain: .28, // gain multiplier
		Release: 1700, // ms 
	};

	this.Poly.MasterGain.gain.value = .17;
	this.Poly.MasterGain.connect(bus.Input);

	this.Poly.LP.connect(this.Poly.MasterGain);
	this.Poly.LP.frequency.value = 2260;
	this.Poly.LP.Q.value = 7;

	this.Poly.Osc1Gain.connect(this.Poly.LP);
	this.Poly.Osc2Gain.connect(this.Poly.LP);
	this.Poly.Osc1Gain.gain.value = .6;
	this.Poly.Osc2Gain.gain.value = .4;

	var poly = this.Poly;

	voices = [];

	for (var i = 0; i < 13; i++) {
		var osc1Gate = context.createGain();
		osc1Gate.connect(self.Poly.Osc1Gain);
		osc1Gate.gain.value = 0;

		var osc2Gate = context.createGain();
		osc2Gate.connect(self.Poly.Osc2Gain);
		osc2Gate.gain.value = 0;

		var osc1 = context.createOscillator();
		osc1.type = "sawtooth";
		osc1.connect(osc1Gate);

		var osc2 = context.createOscillator();
		osc2.type = "square";
		osc2.detune.value = 8;
		osc2.connect(osc2Gate);

		osc1.start(0);
		osc2.start(0);

		voices[i] = { osc1: osc1, osc2: osc2, osc1Gate: osc1Gate, osc2Gate: osc2Gate };
	}

	this.Poly.Off = function() {
		for (var i = 0; i < voices.length; i++) {
			voices[i].osc1Gate.gain.cancelScheduledValues(0);
			voices[i].osc2Gate.gain.cancelScheduledValues(0);
			voices[i].osc1Gate.gain.value = 0;
			voices[i].osc2Gate.gain.value = 0;
		}
	}

	this.Poly.Note = function(canonical, octave, voice) {
		var frequency = freqFromCanonical(canonical);
		voices[voice].osc1.frequency.value = frequency * Math.pow(2, octave);
		voices[voice].osc2.frequency.value = frequency * Math.pow(2, octave);

		this.Trigger = function(at) {
			var realDecay = self.Poly.Decay / 1000;
			var realAttack = self.Poly.Attack / 1000;
			var realRelease = self.Poly.Release / 1000;

			voices[voice].osc1Gate.gain.setTargetAtTime(1, at, realAttack);
			voices[voice].osc2Gate.gain.setTargetAtTime(1, at, realAttack);

			voices[voice].osc1Gate.gain.setTargetAtTime(self.Poly.Sustain, at + realAttack, realDecay)
				voices[voice].osc2Gate.gain.setTargetAtTime(self.Poly.Sustain, at + realAttack, realDecay);

			voices[voice].osc1Gate.gain.setTargetAtTime(0, at + realAttack + realDecay, realRelease);
			voices[voice].osc2Gate.gain.setTargetAtTime(0, at + realAttack + realDecay, realRelease);
		}
	};

	this.Poly.LoadSequence = function(sequence) {
		$(".poly-sequencer-lane > .note").data("on", 0);

		for (var i = 0; i < sequence.length; i++) {
			$($("#poly-lane-" + sequence[i].what.toString().replace(/#/, "s").toLowerCase() + " > .note")[sequence[i].when - 1]).data("on", sequence[i].when);
			$($("#poly-lane-" + sequence[i].what.toString().replace(/#/, "s").toLowerCase() + " > .note")[sequence[i].when - 1]).css("background-color", ColorRed);
		}
	};

	for (var i = 0; i < 32; i++) {
		$('<td class="note">&nbsp;&nbsp;</td>').data("note", self.DrumMachine.OH).appendTo($("#drummachine-sequencer-oh"));
		$('<td class="note">&nbsp;&nbsp;</td>').data("note", self.DrumMachine.CH).appendTo($("#drummachine-sequencer-ch"));
		$('<td class="note">&nbsp;&nbsp;</td>').data("note", self.DrumMachine.SD).appendTo($("#drummachine-sequencer-sd"));
		$('<td class="note">&nbsp;&nbsp;</td>').data("note", self.DrumMachine.BD).appendTo($("#drummachine-sequencer-bd"));

		$('<td class="note">&nbsp;&nbsp;</td>').data("note", new self.Poly.Note("B", 1, 0)).appendTo($("#poly-lane-b"));
		$('<td class="note">&nbsp;&nbsp;</td>').data("note", new self.Poly.Note("A#", 1, 1)).appendTo($("#poly-lane-as"));
		$('<td class="note">&nbsp;&nbsp;</td>').data("note", new self.Poly.Note("A", 1, 2)).appendTo($("#poly-lane-a"));
		$('<td class="note">&nbsp;&nbsp;</td>').data("note", new self.Poly.Note("G#", 1, 3)).appendTo($("#poly-lane-gs"));
		$('<td class="note">&nbsp;&nbsp;</td>').data("note", new self.Poly.Note("G", 1, 4)).appendTo($("#poly-lane-g"));
		$('<td class="note">&nbsp;&nbsp;</td>').data("note", new self.Poly.Note("F#", 1, 5)).appendTo($("#poly-lane-fs"));
		$('<td class="note">&nbsp;&nbsp;</td>').data("note", new self.Poly.Note("F", 1, 6)).appendTo($("#poly-lane-f"));
		$('<td class="note">&nbsp;&nbsp;</td>').data("note", new self.Poly.Note("E", 1, 7)).appendTo($("#poly-lane-e"));
		$('<td class="note">&nbsp;&nbsp;</td>').data("note", new self.Poly.Note("E", 2, 8)).appendTo($("#poly-lane-e2"));
		$('<td class="note">&nbsp;&nbsp;</td>').data("note", new self.Poly.Note("D#", 1, 9)).appendTo($("#poly-lane-ds"));
		$('<td class="note">&nbsp;&nbsp;</td>').data("note", new self.Poly.Note("D", 1, 10)).appendTo($("#poly-lane-d"));
		$('<td class="note">&nbsp;&nbsp;</td>').data("note", new self.Poly.Note("C#", 1, 11)).appendTo($("#poly-lane-cs"));
		$('<td class="note">&nbsp;&nbsp;</td>').data("note", new self.Poly.Note("C", 1, 12)).appendTo($("#poly-lane-c"));
	}

	for (var j = 0; j < 2; j++) {
		for (var i = 1; i <= 16; i++) {
			var n = $('<input id="bass-' + (16 * j + i) + '" value="off" class="note">').data("note", new self.Bass.Note("bass-" + (16 * j + i)));
			var td = $("<td>").append(n).append("</td>");
			$("#bass-sequencer-lane-" + (j + 1)).append(td);
		}
	}

	this.Go = function(defaultPatterns) {
		for (var i = 0; i < defaultPatterns.length; i++) {
			switch (defaultPatterns[i].instrument) {
				case SeqInstruments.Drum78:
					self.DrumMachine.LoadSequence(defaultPatterns[i].p);
					break;
				case SeqInstruments.BluePlanet:
					self.Poly.LoadSequence(defaultPatterns[i].p);
					break;
				case SeqInstruments.Bassline:
					self.Bass.LoadSequence(defaultPatterns[i].p);
					break;
			}
		}

		// assume 8th notes for the time being.
		var t = false;
		$("#sequencer-start").click(function() {
			$(this).css("color", "rgb(250, 250, 250)");
			$("#sequencer-stop").css("color", "rgb(200, 200, 200)");

			var tickTime = 60 / self.Tempo / 4;
			var now = context.currentTime;
			var notes = $(".note");
			for (var i = 0; i < notes.length; i++) {
				var d = $(notes[i]).data("note");
				var on = $(notes[i]).data("on");

				if (d && (on > 0)) {
					d.Trigger(now + ((on - 1) * tickTime));
				}
			}

			t = setTimeout(function() {
				$("#sequencer-start").click();	
			}, tickTime * 32 * 1000);
		});

		$("#sequencer-stop").click(function() {
			$(this).css("color", "rgb(250, 250, 250)");
			$("#sequencer-start").css("color", "rgb(200, 200, 200)");
			self.DrumMachine.Off();
			self.Bass.Off();
			self.Poly.Off();

			clearTimeout(t);
		});
	}

	var master_knob_width = 50;
	var master_knob_height = 50;
	var dynamics_knob_width = 50;
	var dynamics_knob_height = 50;
	var bass_note_knob_height = 45;
	var bass_note_knob_width = 45;
	var drum_control_knob_width = 50;
	var poly_control_knob_width = 50;
	var poly_control_knob_height = 50;

	$("#sequencer-tempo").val(self.Tempo).knob({
		"width": master_knob_width,
		"height": master_knob_height,
		"fgColor": "#FFFFFF",
		"bgColor": "rgb(200,200,200)",
		"inputColor": "#FFFFFF",
		"font": "monospace",
		"min": 50,
		"max": 200,
		"change": function(v) { self.Tempo = v; }
	});

	$("#master-eq-high").val(bus.LowPass.frequency.value).knob({
		"width": master_knob_width,
		"height": master_knob_height,
		"fgColor": "#FFFFFF",
		"bgColor": "rgb(200,200,200)",
		"inputColor": "#FFFFFF",
		"font": "monospace",
		"min": 5000,
		"max": 20000,
		"change": function(v) { bus.LowPass.frequency.value = v; }
	});

	$("#master-eq-low").val(bus.HighPass.frequency.value).knob({
		"width": master_knob_width,
		"height": master_knob_height,
		"min": 0,
		"fgColor": "#FFFFFF",
		"bgColor": "rgb(200,200,200)",
		"inputColor": "#FFFFFF",
		"font": "monospace",
		"max": 1000,
		"change": function(v) { bus.HighPass.frequency.value = v; }
	});

	$("#master-eq-mid").val(bus.Peaking.gain.value).knob({
		"width": master_knob_width,
		"height": master_knob_height,
		"min": -10,
		"max": 10,
		"fgColor": "#FFFFFF",
		"bgColor": "rgb(200,200,200)",
		"inputColor": "#FFFFFF",
		"font": "monospace",
		"step": 1,
		"change": function(v) { bus.Peaking.gain.value = v; }
	});

	$("#master-comp-ratio").val(bus.Comp.ratio.value).knob({
		"width": master_knob_width,
		"height": master_knob_height,
		"min": bus.Comp.ratio.minValue,
		"max": bus.Comp.ratio.maxValue,
		"fgColor": "#FFFFFF",
		"bgColor": "rgb(200,200,200)",
		"inputColor": "#FFFFFF",
		"font": "monospace",
		"change": function(v) { bus.Comp.ratio.value = v; }
	});

	$("#master-comp-threshold").val(bus.Comp.threshold.value).knob({
		"width": dynamics_knob_width,
		"height": dynamics_knob_height,
		"min": bus.Comp.threshold.minValue,
		"max": bus.Comp.threshold.maxValue,
		"fgColor": "#FFFFFF",
		"bgColor": "rgb(200,200,200)",
		"inputColor": "#FFFFFF",
		"font": "monospace",
		"change": function(v) { bus.Comp.threshold.value = v; }
	});

	$("#master-comp-attack").val(parseInt(bus.Comp.attack.value * 1000)).knob({
		"width": dynamics_knob_width,
		"height": dynamics_knob_height,
		"min": 0,
		"fgColor": "white",
		"fgColor": "#FFFFFF",
		"bgColor": "rgb(200,200,200)",
		"inputColor": "#FFFFFF",
		"font": "monospace",
		"max": 1000,
		"step": 1,
		"change": function(v) { bus.Comp.attack.value = v / 1000; }
	});

	$("#master-comp-release").val(bus.Comp.release.value * 1000).knob({
		"width": dynamics_knob_width,
		"height": dynamics_knob_height,
		"min": 0,
		"max": 1000,
		"fgColor": "#FFFFFF",
		"bgColor": "rgb(200,200,200)",
		"inputColor": "#FFFFFF",
		"font": "monospace",
		"step": 1,
		"change": function(v) { bus.Comp.release.value = v / 1000; }
	});

	// drummachine
	$("#drummachine-bd-gain").val(self.DrumMachine.BD.Gain.gain.value * 100).knob({
		"width": poly_control_knob_width,
		"height": poly_control_knob_height,
		"min": 0,
		"max": 100,
		"fgColor": "orange",
		"bgColor": "rgb(200,200,200)",
		"inputColor": "white",
		"font": "monospace",
		"change": function(v) { self.DrumMachine.BD.Gain.gain.value = v / 100; }
	});

	$("#drummachine-sd-gain").val(self.DrumMachine.SD.Gain.gain.value * 100).knob({
		"width": poly_control_knob_width,
		"height": poly_control_knob_height,
		"min": 0,
		"max": 100,
		"fgColor": "orange",
		"bgColor": "rgb(200,200,200)",
		"inputColor": "white",
		"font": "monospace",
		"change": function(v) { self.DrumMachine.SD.Gain.gain.value = v / 100; }
	});

	$("#drummachine-oh-gain").val(self.DrumMachine.OH.Gain.gain.value * 100).knob({
		"width": poly_control_knob_width,
		"height": poly_control_knob_height,
		"min": 0,
		"max": 100,
		"fgColor": "orange",
		"bgColor": "rgb(200,200,200)",
		"inputColor": "white",
		"font": "monospace",
		"change": function(v) { self.DrumMachine.OH.Gain.gain.value = v / 100; }
	});

	$("#drummachine-ch-gain").val(self.DrumMachine.CH.Gain.gain.value * 100).knob({
		"width": poly_control_knob_width,
		"height": poly_control_knob_height,
		"min": 0,
		"max": 100,
		"fgColor": "orange",
		"bgColor": "rgb(200,200,200)",
		"inputColor": "white",
		"font": "monospace",
		"change": function(v) { self.DrumMachine.CH.Gain.gain.value = v / 100; }
	});

	// poly
	$("#poly-env-attack").val(self.Poly.Attack).knob({
		"width": poly_control_knob_width,
		"height": poly_control_knob_height,
		"min": 0,
		"max": 200,
		"fgColor": "#FFFFFF",
		"bgColor": "rgb(200,200,200)",
		"inputColor": "#FFFFFF",
		"font": "monospace",
		"value": 1,
		"step": 1, // approx 1 ms
		"change": function(v) { self.Poly.Attack; }
	});

	$("#poly-env-release").val(self.Poly.Release).knob({
		"width": poly_control_knob_width,
		"height": poly_control_knob_height,
		"min": 0,
		"max": 2000,
		"fgColor": "#FFFFFF",
		"bgColor": "rgb(200,200,200)",
		"inputColor": "#FFFFFF",
		"font": "monospace",
		"step": 10, // approx 10 ms
		"change": function(v) { self.Poly.Release = v; }
	});

	$("#poly-env-sustain").val(self.Poly.Sustain * 100).knob({
		"width": poly_control_knob_width,
		"height": poly_control_knob_height,
		"min": 0,
		"max": 100,
		"fgColor": "#FFFFFF",
		"bgColor": "rgb(200,200,200)",
		"inputColor": "#FFFFFF",
		"font": "monospace",
		"value": 1,
		"step": 1,
		"change": function(v) { self.Poly.Sustain = v / 100; }
	});

	$("#poly-env-decay").val(self.Poly.Decay).knob({
		"width": poly_control_knob_width,
		"height": poly_control_knob_height,
		"min": 10,
		"max": 2000,
		"fgColor": "#FFFFFF",
		"bgColor": "rgb(200,200,200)",
		"inputColor": "#FFFFFF",
		"font": "monospace",
		"step": 10, // approx 10 ms
		"change": function(v) { self.Poly.Decay; }
	});

	$("#poly-filter-freq").val(self.Poly.LP.frequency.value).knob({
		"width": poly_control_knob_width,
		"height": poly_control_knob_height,
		"min": 100,
		"max": 10000,
		"fgColor": "#FFFFFF",
		"bgColor": "rgb(200,200,200)",
		"inputColor": "#FFFFFF",
		"font": "monospace",
		"step": 10, 
		"change": function(v) { self.Poly.LP.frequency.value = v; }
	});

	$("#poly-filter-q").val(self.Poly.LP.Q.value).knob({
		"width": poly_control_knob_width,
		"height": poly_control_knob_height,
		"min": 0,
		"max": 10,
		"fgColor": "#FFFFFF",
		"bgColor": "rgb(200,200,200)",
		"inputColor": "#FFFFFF",
		"font": "monospace",
		"step": 1,
		"change": function(v) { self.Poly.LP.Q.value = v; }
	});

	$("#poly-gain").val(self.Poly.MasterGain.gain.value * 100).knob({
		"width": dynamics_knob_width,
		"height": dynamics_knob_height,
		"min": 0,
		"max": 100,
		"fgColor": "#FFFFFF",
		"bgColor": "rgb(200,200,200)",
		"inputColor": "#FFFFFF",
		"font": "monospace",
		"step": 1,
		"change": function(v) { self.Poly.MasterGain.gain.value = v / 100; }
	});

	$("#drummachine-gain").val(parseInt(self.DrumMachine.MasterGain.gain.value * 100)).knob({
		"width": dynamics_knob_width,
		"height": dynamics_knob_height,
		"min": 0,
		"max": 100,
		"fgColor": "#FFFFFF",
		"bgColor": "rgb(200,200,200)",
		"inputColor": "#FFFFFF",
		"font": "monospace",
		"step": 1,
		"change": function(v) { self.DrumMachine.MasterGain.gain.value = v / 100; }
	});

	$("#bass-gain").val(self.Bass.Gain.gain.value * 100).knob({
		"width": dynamics_knob_width,
		"height": dynamics_knob_height,
		"min": 0,
		"max": 100,
		"fgColor": "#FFFFFF",
		"bgColor": "rgb(200,200,200)",
		"inputColor": "#FFFFFF",
		"font": "monospace",
		"step": 1,
		"change": function(v) { self.Bass.Gain.gain.value = v / 100; }
	});

	$("#poly-osc-mix").val(100 - parseInt(100 * self.Poly.Osc1Gain.gain.value)).knob({
		"width": poly_control_knob_width,
		"height": poly_control_knob_height,
		"min": 0,
		"max": 100,
		"fgColor": "#FFFFFF",
		"bgColor": "rgb(200,200,200)",
		"inputColor": "#FFFFFF",
		"font": "monospace",
		"step": 1,
		"change": function(v) { self.Poly.Osc1Gain.gain.value = (100 - v) / 100; self.Poly.Osc2Gain.gain.value = v / 100; }
	});

	// bass
	for (var i = 1; i <= 32; i++) {
		$("#bass-" + i).val(0).knob({
			"width": bass_note_knob_width,
			"height": bass_note_knob_height,
			"min": 0,
			"max": 13,
			"fgColor": "white",
			"bgColor": "rgb(200,200,200)",
			"inputColor": "white",
			"font": "sans-serif",
			"draw": function() { this.$.val(bassNoteHash[this.$.val()]); }
		});
	}

	$("#bass-env-decay").val(self.Bass.Decay).knob({
		"width": bass_note_knob_width,
		"height": bass_note_knob_height,
		"min": 50,
		"max": 2000,
		"fgColor": "#FFFFFF",
		"bgColor": "rgb(200,200,200)",
		"inputColor": "pink",
		"step": 1,
		"change": function(v) { self.Bass.Decay = v; }
	});

	$("#bass-env-attack").val(self.Bass.Attack).knob({
		"width": bass_note_knob_width,
		"height": bass_note_knob_height,
		"min": 0,
		"max": 200,
		"fgColor": "#FFFFFF",
		"bgColor": "rgb(200,200,200)",
		"inputColor": "pink",
		"step": 1,
		"change": function(v) { self.Bass.Attack = v; }
	});

	$("#bass-filter-freq").val(self.Bass.LP.frequency.value).knob({
		"width": bass_note_knob_width,
		"height": bass_note_knob_height,
		"min": 200,
		"max": 1000,
		"fgColor": "#FFFFFF",
		"bgColor": "rgb(200,200,200)",
		"inputColor": "pink",
		"step": 1,
		"change": function(v) { self.Bass.LP.frequency.value = v; }
	});

	$("#bass-filter-q").val(self.Bass.LP.Q.value).knob({
		"width": bass_note_knob_width,
		"height": bass_note_knob_height,
		"min": 0,
		"max": 50,
		"fgColor": "#FFFFFF",
		"bgColor": "rgb(200,200,200)",
		"inputColor": "pink",
		"step": 1,
		"change": function(v) { self.Bass.LP.Q.value = v; }
	});

	$(".note").click(function() { 
		var self = this;
		var d = $(self).data();
		if (d.on > 0) {
			d.on = 0;
			$(self).css("background-color", ColorBase2);
		} else {
			d.on = $(self).index(); // index + 1 offset - 1 label = 0
			$(self).css("background-color", ColorRed);
		}
	});

}
