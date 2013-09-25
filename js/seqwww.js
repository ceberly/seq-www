ColorRed = "rgb(220, 50, 47)";
ColorOrange = "rgb(203, 75, 22)";
ColorBase1 = "rgb(147, 161, 161)";
ColorWhite = "rgb(255, 255, 255)";
ColorBase2 = "rgb(238, 232, 213)";

DrumSound = {
	BD: "BD",
	SD: "SD",
	CH: "CH",
	OH: "OH",
};

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

	this.Bus = {
		Gain: context.createGain(),
		//Delay: context.createDelay(),
		Comp: context.createDynamicsCompressor(),
		HighShelf: context.createBiquadFilter(),
		Peaking: context.createBiquadFilter(),
		LowShelf: context.createBiquadFilter(),
	};

	this.Bus.Input = this.Bus.LowShelf;

	this.Bus.HighShelf.type = "highshelf";
	this.Bus.HighShelf.frequency.value = 8000;

	this.Bus.Peaking.type = "peaking";
	this.Bus.Peaking.frequency.value = 1200;

	this.Bus.LowShelf.type = "lowshelf";
	this.Bus.LowShelf.frequency.value = 100;

	this.Bus.Gain.connect(context.destination);
	this.Bus.Comp.connect(this.Bus.Gain);
	this.Bus.HighShelf.connect(this.Bus.Comp);
	this.Bus.Peaking.connect(this.Bus.HighShelf);
	this.Bus.LowShelf.connect(this.Bus.Peaking);

	var bus = this.Bus;

	this.DrumMachine = {
		MasterGain: context.createGain(),
		BD: {
			Decay: 0
		},
		SD: {
			Decay: 0
		},
		CH: {

		},
		OH: {
		},
		LoadSequence: function(sequence) {
			$(".drummachine-lane > .note").data("on", 0);
			for (var i = 0; i < sequence.length; i++) {
				switch (sequence[i].what) {
					case DrumSound.BD:
						$($("#drummachine-sequencer-bd > .note")[sequence[i].when - 1]).data("on", sequence[i].when);
						$($("#drummachine-sequencer-bd > .note")[sequence[i].when - 1]).css("background-color", ColorRed);
						break;
					case DrumSound.SD:
						$($("#drummachine-sequencer-sd > .note")[sequence[i].when - 1]).data("on", sequence[i].when);
						$($("#drummachine-sequencer-sd > .note")[sequence[i].when - 1]).css("background-color", ColorRed);
						break;
					case DrumSound.CH:
						$($("#drummachine-sequencer-ch > .note")[sequence[i].when - 1]).data("on", sequence[i].when);
						$($("#drummachine-sequencer-ch > .note")[sequence[i].when - 1]).css("background-color", ColorRed);
						break;
					case DrumSound.OH:
						$($("#drummachine-sequencer-oh > .note")[sequence[i].when - 1]).data("on", sequence[i].when);
						$($("#drummachine-sequencer-oh > .note")[sequence[i].when - 1]).css("background-color", ColorRed);
						break;
					default:
						console.log("Unexpected drum sound: " + sequence[i].what.toString());
				}
			}
		},
	};

	this.DrumMachine.MasterGain.connect(bus.Input);

	//BD
	var bdGate = context.createGain();
	bdGate.gain.value = 0;
	bdGate.connect(this.DrumMachine.MasterGain);

	var bdEnv = context.createGain();
	bdEnv.gain.value = 0;
	bdEnv.connect(this.DrumMachine.MasterGain);

	var bdLP = context.createBiquadFilter();
	bdLP.frequency.value = 100;
	bdLP.Q.value = 0;
	bdLP.connect(bdEnv);

	var bdOsc1 = context.createOscillator();
	bdOsc1.frequency.value = 65;
	bdOsc1.connect(bdGate);
	bdOsc1.start(0);

	var bdOsc2 = context.createOscillator();
	bdOsc2.type = "square";
	bdOsc2.frequency.value = 65;
	bdOsc2.connect(bdLP);
	bdOsc2.start(0);

	this.DrumMachine.BD.Trigger = function(at) {
			bdGate.gain.setTargetAtTime(1, at, .03);
			bdGate.gain.setTargetAtTime(0, at + .05, .1);

			bdEnv.gain.setTargetAtTime(1, at, .01);
			bdEnv.gain.setTargetAtTime(0, at + .05, .03);
	};

	//SD
	var sdGate = context.createGain();
	sdGate.gain.value = 0;
	sdGate.connect(this.DrumMachine.MasterGain);

	var sdWNEnv = context.createGain();
	sdWNEnv.connect(sdGate);
	sdWNEnv.gain.value = 0;

	var sdOsc1Env = context.createGain();
	sdOsc1Env.connect(this.DrumMachine.MasterGain);
	sdOsc1Env.gain.value = 0;

	var sdOsc2Env = context.createGain();
	sdOsc2Env.connect(this.DrumMachine.MasterGain);
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

	this.DrumMachine.SD.Trigger = function(at) {
			sdGate.gain.setTargetAtTime(1, at, 0);
			sdGate.gain.setTargetAtTime(0, at + .03, .03);

			sdOsc1Env.gain.setTargetAtTime(.1, at, 0);
			sdOsc1Env.gain.setTargetAtTime(0, at + .03, .03);

			sdOsc2Env.gain.setTargetAtTime(.1, at, 0);
			sdOsc2Env.gain.setTargetAtTime(0, at + .03, .03);
	};

	//CH
	var chHP = context.createBiquadFilter();
	chHP.connect(this.DrumMachine.MasterGain);
	chHP.type = "highpass";
	chHP.frequency.value = 10000;

	// high bandpass
	var chHGain1 = context.createGain();
	chHGain1.connect(chHP);
	chHGain1.gain.value = 0;

	var chHGain2 = context.createGain();
	chHGain2.connect(chHP);
	chHGain2.gain.value = 0;

	var chHBPSplit = context.createChannelSplitter(2);
	chHBPSplit.connect(chHGain1, 0);
	chHBPSplit.connect(chHGain2, 1);

	var chHBP = context.createBiquadFilter();
	chHBP.type = "bandpass";
	chHBP.frequency.value = 7000;
	chHBP.Q.value = 12;
	chHBP.connect(chHBPSplit);

	// low bandpass
	var chLBGain = context.createGain();
	chLBGain.connect(chHP);
	chLBGain.gain.value = 0;

	var chLBP = context.createBiquadFilter();
	chLBP.type = "bandpass";
	chLBP.frequency.value = 3500;
	chLBP.Q.value = 12;
	chLBP.connect(chLBGain);

	var chSplit = context.createChannelSplitter(2);
	chSplit.connect(chLBP);
	chSplit.connect(chHBP);

	var chOsc1 = context.createOscillator();
	chOsc1.type = "square";
	chOsc1.frequency.value = 303;
	chOsc1.connect(chSplit);
	chOsc1.start(0);

	var chOsc2 = context.createOscillator();
	chOsc2.type = "square";
	chOsc2.frequency.value = 176;
	chOsc2.connect(chSplit);
	chOsc2.start(0);

	var chOsc3 = context.createOscillator();
	chOsc3.type = "square";
	chOsc3.frequency.value = 214;
	chOsc3.connect(chSplit);
	chOsc3.start(0);

	var chOsc4 = context.createOscillator();
	chOsc4.type = "square";
	chOsc4.frequency.value = 119;
	chOsc4.connect(chSplit);
	chOsc4.start(0);

	var chOsc5 = context.createOscillator();
	chOsc5.type = "square";
	chOsc5.frequency.value = 540;
	chOsc5.connect(chSplit);
	chOsc5.start(0);

	var chOsc6 = context.createOscillator();
	chOsc6.type = "square";
	chOsc6.frequency.value = 800;
	chOsc6.connect(chSplit);
	chOsc6.start(0);

	this.DrumMachine.CH.Trigger = function(at) {
		chHGain1.gain.setTargetAtTime(1, at, 0);
		chHGain1.gain.setTargetAtTime(0, at + .01, .01);

		chHGain2.gain.setTargetAtTime(1, at, 0);
		chHGain2.gain.setTargetAtTime(0, at + .02, .01);

		chLBGain.gain.setTargetAtTime(1, at, 0);
		chLBGain.gain.setTargetAtTime(0, at + .02, .01);
	};

	this.Bass = {
		LP: context.createBiquadFilter(),
		Osc: context.createOscillator(),
		Gain: context.createGain(),
		Attack: .1,
		Decay: .5,
	}

	var bass = this.Bass;

	bass.Gain.connect(bus.Input);
	bass.LP.connect(this.Bass.Gain);

	var bassEnv = context.createGain();
	bassEnv.connect(bass.LP);
	bassEnv.gain.value = 0;

	bass.Osc.connect(bassEnv);
	bass.Osc.type = "sawtooth";
	bass.Osc.start(0);

	bass.Note = function(inputId) {
		this.Trigger = function(at) {
			var frequency = freqFromCanonical($("#" + inputId).val());
			bass.Osc.frequency.setTargetAtTime(frequency / 2, at, 0);
			bassEnv.gain.setTargetAtTime(1, at, 0);	
			bassEnv.gain.setTargetAtTime(0, at + .1, 0);
		}
	}

	bass.LoadSequence = function(sequence) {
		$(".bass-sequencer-lane > .note").data("on", 0);

		for (var i = 0; i < sequence.length; i++) {
			$("#bass-" + sequence[i].when).val(sequence[i].what).data("on", sequence[i].when);
		}
	}

	this.Poly = {
		LP: context.createBiquadFilter(),
		MasterGain: context.createGain(),
		Osc1Gain: context.createGain(),
		Osc2Gain: context.createGain(),
		Octave: 0,
		Attack: .1, // seconds
		Decay: .1, // seconds
		Sustain: .76, // gain multiplier
		Release: .5, // seconds
	};

	this.Poly.MasterGain.connect(bus.Input);

	this.Poly.LP.connect(this.Poly.MasterGain);
	this.Poly.LP.frequency.value = 2500;
	this.Poly.LP.Q.value = 0;

	this.Poly.Osc1Gain.connect(this.Poly.LP);
	this.Poly.Osc2Gain.connect(this.Poly.LP);

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
		osc2.type = "sawtooth";
		osc2.detune.value = "8";
		osc2.connect(osc2Gate);

		osc1.start(0);
		osc2.start(0);

		voices[i] = { osc1: osc1, osc2: osc2, osc1Gate: osc1Gate, osc2Gate: osc2Gate };
	}

	this.Poly.Note = function(canonical, octave, voice) {
		var frequency = freqFromCanonical(canonical);
		voices[voice].osc1.frequency.value = frequency * Math.pow(2, octave);
		voices[voice].osc2.frequency.value = frequency * Math.pow(2, octave);

		this.Trigger = function(at) {
			voices[voice].osc1Gate.gain.setTargetAtTime(1, at, self.Poly.Attack);
			voices[voice].osc2Gate.gain.setTargetAtTime(1, at, self.Poly.Attack);

			voices[voice].osc1Gate.gain.setTargetAtTime(0, at + self.Poly.Attack + self.Poly.Decay, self.Poly.Release);
			voices[voice].osc2Gate.gain.setTargetAtTime(0, at + self.Poly.Attack + self.Poly.Decay, self.Poly.Release);
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
		$('<span class="note"></span>').data("note", self.DrumMachine.CH).appendTo($("#drummachine-sequencer-oh"));
		$('<span class="note"></span>').data("note", self.DrumMachine.CH).appendTo($("#drummachine-sequencer-ch"));
		$('<span class="note"></span>').data("note", self.DrumMachine.SD).appendTo($("#drummachine-sequencer-sd"));
		$('<span class="note"></span>').data("note", self.DrumMachine.BD).appendTo($("#drummachine-sequencer-bd"));

		$('<span class="note"></span>').data("note", new self.Poly.Note("B", 0, 0)).appendTo($("#poly-lane-b"));
		$('<span class="note"></span>').data("note", new self.Poly.Note("A#", 0, 1)).appendTo($("#poly-lane-as"));
		$('<span class="note"></span>').data("note", new self.Poly.Note("A", 0, 2)).appendTo($("#poly-lane-a"));
		$('<span class="note"></span>').data("note", new self.Poly.Note("G#", 0, 3)).appendTo($("#poly-lane-gs"));
		$('<span class="note"></span>').data("note", new self.Poly.Note("G", 0, 4)).appendTo($("#poly-lane-g"));
		$('<span class="note"></span>').data("note", new self.Poly.Note("F#", 0, 5)).appendTo($("#poly-lane-fs"));
		$('<span class="note"></span>').data("note", new self.Poly.Note("F", 0, 6)).appendTo($("#poly-lane-f"));
		$('<span class="note"></span>').data("note", new self.Poly.Note("E", 0, 7)).appendTo($("#poly-lane-e"));
		$('<span class="note"></span>').data("note", new self.Poly.Note("E", 1, 8)).appendTo($("#poly-lane-e2"));
		$('<span class="note"></span>').data("note", new self.Poly.Note("D#", 0, 9)).appendTo($("#poly-lane-ds"));
		$('<span class="note"></span>').data("note", new self.Poly.Note("D", 0, 10)).appendTo($("#poly-lane-d"));
		$('<span class="note"></span>').data("note", new self.Poly.Note("C#", 0, 11)).appendTo($("#poly-lane-cs"));
		$('<span class="note"></span>').data("note", new self.Poly.Note("C", 0, 12)).appendTo($("#poly-lane-c"));

		$('<input id="bass-' + (i + 1) + '" value="off" class="note">').data("note", new self.Bass.Note("bass-" + (i + 1))).appendTo($("#bass-sequencer-lane"));
	}

	this.LoadSequence = function(tempo) {
		// assume 8th notes for the time being.
		var tickTime = 60 / tempo / 4;
		var t = false;
		$("#sequencer-start").click(function() {
			var now = context.currentTime;
			var notes = $("#bass-sequencer-lane > div > .note");
			for (var i = 0; i < notes.length; i++) {
				var d = $(notes[i]).data("note");
				var on = $(notes[i]).data("on");

				if (d && (on > 0)) {
					d.Trigger(now + ((on - 1) * tickTime));
				}
			}

			t = setTimeout(function() {
				$("#sequencer-start").click();	
			}, tickTime * 16 * 1000);
		});

		$("#sequencer-stop").click(function() {
			clearTimeout(t);
		});
	}

	this.SetupUI = function(bus, drummachine, poly) {
		var master_knob_width = 50;
		var bass_note_knob_height = 25;
		var bass_note_knob_width = 25;
		var drum_control_knob_width = 50;
		var poly_control_knob_width = 50;
		var poly_control_knob_height = 50;

		$("#master-gain > input").knob({
			"width": master_knob_width,
			"min": this.Bus.Gain.gain.minValue * 100,
			"max": this.Bus.Gain.gain.maxValue * 100,
			"value": this.Bus.Gain.gain.value,
			"change": function(v) { this.Bus.Gain.gain.value = (v / 100); }
		});

		$("#master-eq-high > input").knob({
			"width": master_knob_width,
			"min": this.Bus.HighShelf.gain.minValue,
			"max": this.Bus.HighShelf.gain.maxValue,
			"value": 0,
			"change": function(v) { this.Bus.HighShelf.gain.value = v; }
		});

		$("#master-eq-low > input").knob({
			"width": master_knob_width,
			"min": this.Bus.LowShelf.gain.minValue,
			"max": this.Bus.LowShelf.gain.maxValue,
			"value": 0,
			"change": function(v) { this.Bus.LowShelf.gain.value = v; }
		});

		$("#master-eq-mid > input").knob({
			"width": master_knob_width,
			"min": this.Bus.Peaking.gain.minValue,
			"max": this.Bus.Peaking.gain.maxValue,
			"value": 0,
			"change": function(v) { this.Bus.Peaking.gain.value = v; }
		});

		$("#master-comp-threshold > input").knob({
			"width": master_knob_width,
			"min": this.Bus.Comp.threshold.minValue,
			"max": this.Bus.Comp.threshold.maxValue,
			"value": this.Bus.Comp.threshold.value,
			"change": function(v) { this.Bus.Comp.threshold.value = v; }
		});

		$("#master-comp-ratio > input").knob({
			"width": master_knob_width,
			"min": this.Bus.Comp.ratio.minValue,
			"max": this.Bus.Comp.ratio.maxValue,
			"value": this.Bus.Comp.ratio.value,
			"change": function(v) { this.Bus.Comp.ratio.value = v; }
		});

		$("#master-comp-attack > input").knob({
			"width": master_knob_width,
			"min": this.Bus.Comp.attack.minValue,
			"max": this.Bus.Comp.attack.maxValue,
			"value": this.Bus.Comp.attack.value,
			"change": function(v) { this.Bus.Comp.attack.value = v; }
		});

		$("#master-comp-release > input").knob({
			"width": master_knob_width,
			"min": this.Bus.Comp.release.minValue,
			"max": this.Bus.Comp.release.maxValue,
			"value": this.Bus.Comp.release.value,
			"change": function(v) { this.Bus.Comp.release.value = v; }
		});

		// poly
		$("#poly-env-attack").val(self.Poly.Attack * 1000).knob({
			"width": poly_control_knob_width,
			"height": poly_control_knob_height,
			"min": 0,
			"max": 100,
			"fgColor": "#FFFFFF",
			"bgColor": "rgb(200,200,200)",
			"inputColor": "#FFFFFF",
			"font": "monospace",
			"value": 1,
			"step": 1, // approx 1 ms
			"change": function(v) { self.Poly.Attack = v / 1000; }
		});

		$("#poly-env-release").val(self.Poly.Release * 1000).knob({
			"width": poly_control_knob_width,
			"height": poly_control_knob_height,
			"min": 0,
			"max": 1000,
			"fgColor": "#FFFFFF",
			"bgColor": "rgb(200,200,200)",
			"inputColor": "#FFFFFF",
			"font": "monospace",
			"step": 10, // approx 10 ms
			"change": function(v) { self.Poly.Release = v / 1000; }
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
			"max": 500,
			"fgColor": "#FFFFFF",
			"bgColor": "rgb(200,200,200)",
			"inputColor": "#FFFFFF",
			"font": "monospace",
			"step": 1, 
			"change": function(v) { self.Poly.LP.frequency.value = v / 100; }
		});

		// bass
		var bassNoteHash = ["off", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E2"];
		for (var i = 0; i <= 32; i++) {
			$("#bass-" + i).val(0).knob({
				"width": bass_note_knob_width,
				"height": bass_note_knob_height,
				"min": 0,
				"max": 13,
				"step": 1,
				"draw": function() { this.$.val(bassNoteHash[this.$.val()]); }
			});
		}

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
}
