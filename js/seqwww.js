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
						$($("#drummachine-sequencer-bd > .note")[sequence[i].when - 1]).css("background-color", "red");
						break;
					case DrumSound.SD:
						$($("#drummachine-sequencer-sd > .note")[sequence[i].when - 1]).data("on", sequence[i].when);
						$($("#drummachine-sequencer-sd > .note")[sequence[i].when - 1]).css("background-color", "red");
						break;
					case DrumSound.CH:
						$($("#drummachine-sequencer-ch > .note")[sequence[i].when - 1]).data("on", sequence[i].when);
						$($("#drummachine-sequencer-ch > .note")[sequence[i].when - 1]).css("background-color", "red");
						break;
					case DrumSound.OH:
						$($("#drummachine-sequencer-oh > .note")[sequence[i].when - 1]).data("on", sequence[i].when);
						$($("#drummachine-sequencer-oh > .note")[sequence[i].when - 1]).css("background-color", "red");
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
	this.Poly.Note = function(canonical, octave) {
		var frequency = 0;
		switch(canonical) {
			case "A":
				frequency = 220;
				break;
			case "A#":
				frequency = 233.1;
				break;
			case "B":
				frequency = 246.9;
				break;
			case "C":
				frequency = 130.8;
				break;
			case "C#":
				frequency = 138.6;
				break;
			case "D":
				frequency = 146.8;
				break;
			case "D#":
				frequency = 155.6;
				break;
			case "E":
				frequency = 164.8;
				break;
			case "F":
				frequency = 174.6;
				break;
			case "F#":
				frequency = 185;
				break;
			case "G":
				frequency = 195;
				break;
			case "G#":
				frequency = 207.7;
				break;
		}

		var osc1Gate = context.createGain();
		osc1Gate.connect(self.Poly.Osc1Gain);
		osc1Gate.gain.value = 0;

		var osc2Gate = context.createGain();
		osc2Gate.connect(self.Poly.Osc2Gain);
		osc2Gate.gain.value = 0;

		this.osc1 = context.createOscillator();
		this.osc1.type = "sawtooth";
		this.osc1.frequency.value = frequency * Math.pow(2, octave);
		this.osc1.connect(osc1Gate);

		this.osc2 = context.createOscillator();
		this.osc2.type = "square";
		this.osc2.frequency.value = frequency * Math.pow(2, octave);
		this.osc2.connect(osc2Gate);

		this.osc1.start(0);
		this.osc2.start(0);

		var oscillators = [this.osc1, this.osc2];
		this.Trigger = function(at) {
			osc1Gate.gain.setTargetAtTime(1, at, self.Poly.Attack);
			osc2Gate.gain.setTargetAtTime(1, at, self.Poly.Attack);

			osc1Gate.gain.setTargetAtTime(1 * self.Poly.Sustain, at + self.Poly.Attack, self.Poly.Decay);
			osc2Gate.gain.setTargetAtTime(1 * self.Poly.Sustain, at + self.Poly.Attack, self.Poly.Decay);

			osc1Gate.gain.setTargetAtTime(0, at + self.Poly.Attack + self.Poly.Decay, self.Poly.Release);
			osc2Gate.gain.setTargetAtTime(0, at + self.Poly.Attack + self.Poly.Decay, self.Poly.Release);
		}
	};

	this.Poly.LoadSequence = function(sequence) {
		$(".poly-sequencer-lane > .note").data("on", 0);

		for (var i = 0; i < sequence.length; i++) {
			$($("#poly-lane-" + sequence[i].what.toString().replace(/#/, "s").toLowerCase() + " > .note")[sequence[i].when - 1]).data("on", sequence[i].when);
			$($("#poly-lane-" + sequence[i].what.toString().replace(/#/, "s").toLowerCase() + " > .note")[sequence[i].when - 1]).css("background-color", ColorRed);
		}
	};

	for (var i = 0; i < 16; i++) {
		$('<button class="note"></button>').data("note", self.DrumMachine.CH).appendTo($("#drummachine-sequencer-oh"));
		$('<button class="note"></button>').data("note", self.DrumMachine.CH).appendTo($("#drummachine-sequencer-ch"));
		$('<button class="note"></button>').data("note", self.DrumMachine.SD).appendTo($("#drummachine-sequencer-sd"));
		$('<button class="note"></button>').data("note", self.DrumMachine.BD).appendTo($("#drummachine-sequencer-bd"));

		$('<button class="note"></button>').data("note", new self.Poly.Note("B", 0)).appendTo($("#poly-lane-b"));
		$('<button class="note"></button>').data("note", new self.Poly.Note("A#", 0)).appendTo($("#poly-lane-as"));
		$('<button class="note"></button>').data("note", new self.Poly.Note("A", 0)).appendTo($("#poly-lane-a"));
		$('<button class="note"></button>').data("note", new self.Poly.Note("G#", 0)).appendTo($("#poly-lane-gs"));
		$('<button class="note"></button>').data("note", new self.Poly.Note("G", 0)).appendTo($("#poly-lane-g"));
		$('<button class="note"></button>').data("note", new self.Poly.Note("F#", 0)).appendTo($("#poly-lane-fs"));
		$('<button class="note"></button>').data("note", new self.Poly.Note("F", 0)).appendTo($("#poly-lane-f"));
		$('<button class="note"></button>').data("note", new self.Poly.Note("E", 0)).appendTo($("#poly-lane-e"));
		$('<button class="note"></button>').data("note", new self.Poly.Note("E", 1)).appendTo($("#poly-lane-e2"));
		$('<button class="note"></button>').data("note", new self.Poly.Note("D#", 0)).appendTo($("#poly-lane-ds"));
		$('<button class="note"></button>').data("note", new self.Poly.Note("D", 0)).appendTo($("#poly-lane-d"));
		$('<button class="note"></button>').data("note", new self.Poly.Note("C#", 0)).appendTo($("#poly-lane-cs"));
		$('<button class="note"></button>').data("note", new self.Poly.Note("C", 0)).appendTo($("#poly-lane-c"));
	}

	this.LoadSequence = function(tempo) {
		// assume 8th notes for the time being.
		var tickTime = 60 / tempo / 2;
		var t = false;
		$("#sequencer-start").click(function() {
			var now = context.currentTime;
			var notes = $(".drummachine-lane > .note");
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

		// drummmachine controls
		$("#drummachine-controls-bd-decay > input").knob({
			"width": drum_control_knob_width,
			"min": 0,
			"max": 100,
			"value": 0,
		});

		// poly
		$("#poly-env-attack").val(self.Poly.Attack * 1000).knob({
			"width": poly_control_knob_width,
			"height": poly_control_knob_height,
			"min": 0,
			"max": 100,
			"value": 1,
			"step": 1, // approx 1 ms
			"change": function(v) { self.Poly.Attack = v / 1000; }
		});

		$("#poly-env-decay").val(self.Poly.Decay * 1000).knob({
			"width": poly_control_knob_width,
			"height": poly_control_knob_height,
			"min": 0,
			"max": 1000,
			"step": 10, // approx 1 ms
			"change": function(v) { self.Poly.Decay = v / 1000; }
		})

		$("#poly-env-sustain").val(self.Poly.Sustain * 100).knob({
			"width": poly_control_knob_width,
			"height": poly_control_knob_height,
			"min": 0,
			"max": 100,
			"step": 1, // percent of gain
			"change": function(v) { self.Poly.Sustain = v / 100; }
		});

		$("#poly-env-release").val(self.Poly.Release * 1000).knob({
			"width": poly_control_knob_width,
			"height": poly_control_knob_height,
			"min": 0,
			"max": 1000,
			"step": 10, // approx 10 ms
			"change": function(v) { self.Poly.Release = v / 1000; }
		});

		$("#poly-filter-freq").val(self.Poly.LP.frequency.value).knob({
			"width": poly_control_knob_width,
			"height": poly_control_knob_height,
			"min": 100,
			"max": 10000,
			"step": 10, 
			"change": function(v) { self.Poly.LP.frequency.value = v; }
		});

		$("#poly-filter-q").val(self.Poly.LP.Q.value).knob({
			"width": poly_control_knob_width,
			"height": poly_control_knob_height,
			"min": 0,
			"max": 500,
			"step": 1, 
			"change": function(v) { self.Poly.LP.frequency.value = v / 100; }
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
}
