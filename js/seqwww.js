ColorRed = "rgb(220, 50, 47)";
ColorOrange = "rgb(203, 75, 22)";
ColorBase1 = "rgb(147, 161, 161)";
ColorWhite = "rgb(255, 255, 255)";
ColorBase2 = "rgb(238, 232, 213)";

PatchType = {
	Drum: 0,
	Chord: 1
};

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
		// reverb isn't working right now.
		//var reverb: outputContext.createConvolver(),
		//reverb.connect(gain),
		Delay: context.createDelay(),
		Dist: context.createWaveShaper(),
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

	this.Bus.Dist.amount = 0;
	this.Bus.Gain.connect(context.destination);
	this.Bus.Delay.connect(this.Bus.Gain);
	this.Bus.Dist.connect(this.Bus.Delay);
	this.Bus.Comp.connect(this.Bus.Dist);
	this.Bus.HighShelf.connect(this.Bus.Comp);
	this.Bus.Peaking.connect(this.Bus.HighShelf);
	this.Bus.LowShelf.connect(this.Bus.Peaking);

	var bus = this.Bus;

	this.DrumMachine = {
		BD: function() {
			var osc1 = context.createOscillator();
			osc1.frequency.value = 62;
			osc1.connect(bus.Input);
			this.Trigger = function(at) {
				osc1.start(at);
				osc1.stop(at + .5);
			};
		},
		SD: function() {
			var osc1 = context.createOscillator();
			osc1.type = "square";
			osc1.frequency.value = 300;
			osc1.connect(bus.Input);
			this.Trigger = function(at) {
				osc1.start(at);
				osc1.stop(at + .2);
			};
		},
		CH: function() {
			var osc1 = context.createOscillator();
			osc1.frequency.value = 500;
			osc1.type = "square";
			osc1.connect(bus.Input);
			this.Trigger = function(at) {
				osc1.start(at);
				osc1.stop(at + .1);
			};
		},
		OH: function() {
			var osc1 = context.createOscillator();
			osc1.frequency.value = 1000;
			osc1.type = "square";
			osc1.connect(bus.Input);
			this.Trigger = function(at) {
				osc1.start(at);
				osc1.stop(at + .5);
			};
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


	this.Poly = {
		LP: context.createBiquadFilter(),
		SawDetuneGain: context.createGain(),
		SineGain: context.createGain(),
		Octave: 0,
		SawDetune: 0, // cents
		SquareDetune: 0, // cents
		Attack: .034, // seconds
		Decay: .1, // seconds
		Sustain: .76, // gain multiplier
		Release: .048, // seconds
	};

	this.Poly.SawDetuneGain.connect(this.Poly.LP);
	this.Poly.SineGain.connect(bus.Input);
	this.Poly.LP.connect(bus.Input);
	this.Poly.LP.frequency.value = 3500;
	this.Poly.LP.Q.value = 0;

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
		osc1Gate.connect(self.Poly.LP);
		osc1Gate.gain.value = 0;

		var osc2Gate = context.createGain();
		osc2Gate.connect(self.Poly.SawDetuneGain);
		osc2Gate.gain.value = 0;

		var osc3Gate = context.createGain();
		osc3Gate.connect(self.Poly.SineGain);
		osc3Gate.gain.value = 0;

		this.osc1 = context.createOscillator();
		this.osc1.type = "sawtooth";
		this.osc1.frequency.value = frequency * Math.pow(2, octave);
		this.osc1.connect(osc1Gate);

		this.osc2 = context.createOscillator();
		this.osc2.type = "sawtooth";
		this.osc2.detune.value = 8;
		this.osc2.frequency.value = frequency * Math.pow(2, octave);
		this.osc2.connect(osc2Gate);

		this.osc3 = context.createOscillator();
		this.osc3.type = "sine";
		this.osc3.frequency.value = frequency * Math.pow(2, octave);
		this.osc3.connect(osc3Gate);

		this.osc1.start(0);
		this.osc2.start(0);
		this.osc3.start(0);

		var oscillators = [this.osc1, this.osc2];
		this.Trigger = function(at) {
			osc1Gate.gain.setTargetAtTime(1, at, self.Poly.Attack);
			osc2Gate.gain.setTargetAtTime(1, at, self.Poly.Attack);
			osc3Gate.gain.setTargetAtTime(1, at, self.Poly.Attack);

			osc1Gate.gain.setTargetAtTime(1 * self.Poly.Sustain, at + self.Poly.Attack, self.Poly.Decay);
			osc2Gate.gain.setTargetAtTime(1 * self.Poly.Sustain, at + self.Poly.Attack, self.Poly.Decay);
			osc3Gate.gain.setTargetAtTime(1 * self.Poly.Sustain, at + self.Poly.Attack, self.Poly.Decay);

			osc1Gate.gain.setTargetAtTime(0, at + self.Poly.Attack + self.Poly.Decay, self.Poly.Release);
			osc2Gate.gain.setTargetAtTime(0, at + self.Poly.Attack + self.Poly.Decay, self.Poly.Release);
			osc3Gate.gain.setTargetAtTime(0, at + self.Poly.Attack + self.Poly.Decay, self.Poly.Release);
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
		$('<button class="note"></button>').data("note", new self.DrumMachine.OH()).appendTo($("#drummachine-sequencer-oh"));
		$('<button class="note"></button>').data("note", new self.DrumMachine.CH()).appendTo($("#drummachine-sequencer-ch"));
		$('<button class="note"></button>').data("note", new self.DrumMachine.SD()).appendTo($("#drummachine-sequencer-sd"));
		$('<button class="note"></button>').data("note", new self.DrumMachine.BD()).appendTo($("#drummachine-sequencer-bd"));

		$('<button class="note"></button>').data("note", new self.Poly.Note("B", 0)).appendTo($("#poly-lane-b"));
		$('<button class="note"></button>').data("note", new self.Poly.Note("A#", 0)).appendTo($("#poly-lane-as"));
		$('<button class="note"></button>').data("note", new self.Poly.Note("A", 0)).appendTo($("#poly-lane-a"));
		$('<button class="note"></button>').data("note", new self.Poly.Note("G#", 0)).appendTo($("#poly-lane-gs"));
		$('<button class="note"></button>').data("note", new self.Poly.Note("G", 0)).appendTo($("#poly-lane-g"));
		$('<button class="note"></button>').data("note", new self.Poly.Note("F#", 0)).appendTo($("#poly-lane-fs"));
		$('<button class="note"></button>').data("note", new self.Poly.Note("F", 0)).appendTo($("#poly-lane-f"));
		$('<button class="note"></button>').data("note", new self.Poly.Note("E", 0)).appendTo($("#poly-lane-e"));
		$('<button class="note"></button>').data("note", new self.Poly.Note("D#", 0)).appendTo($("#poly-lane-ds"));
		$('<button class="note"></button>').data("note", new self.Poly.Note("D", 0)).appendTo($("#poly-lane-d"));
		$('<button class="note"></button>').data("note", new self.Poly.Note("C#", 0)).appendTo($("#poly-lane-cs"));
		$('<button class="note"></button>').data("note", new self.Poly.Note("C", 0)).appendTo($("#poly-lane-c"));
	}

	this.LoadSequence = function(tempo) {
		// assume 16th notes for the time being.
		var tickTime = 60 / tempo / 4;
		var t = false;
		$("#sequencer-start").click(function() {
			var now = context.currentTime;
			var notes = $(".poly-sequencer-lane > .note");
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

		$("#master-dist-amount > input").knob({
			"width": master_knob_width,
			"min": 0,
			"max": 100,
			"value": this.Bus.Dist.amount,
			"change": function(v) { this.Bus.Dist.amount = v; }
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

		$("#poly-osc2-gain").val(self.Poly.SawDetuneGain.gain.value * 100).knob({
			"width": poly_control_knob_width,
			"height": poly_control_knob_height,
			"min": 0,
			"max": 100,
			"step": 1, 
			"change": function(v) { self.Poly.SawDetuneGain.gain.value = v / 100; }
		});

		$("#poly-filter-freq").val(self.Poly.LP.frequency.value).knob({
			"width": poly_control_knob_width,
			"height": poly_control_knob_height,
			"min": 100,
			"max": 10000,
			"step": 10, 
			"change": function(v) { self.Poly.LP.frequency.value = v; }
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
