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
		SawGain: context.createGain(),
		SquareGain: context.createGain(),
		SawDetune: 0,
		SquareDetune: 0,
	};

	this.Poly.SawGain.connect(this.Poly.LP);
	this.Poly.SquareGain.connect(this.Poly.LP);
	this.Poly.LP.connect(bus.Input);

	var self = this;
	this.Poly.Note = function(canonical, octave) {
		var frequency = 0;
		switch(canonical) {
			case "A":
				frequency = 220 * Math.pow(2, octave);
				break;
			case "A#":
				frequency = 233.1 * Math.pow(2, octave);
				break;
			case "B":
				frequency = 246.9 * Math.pow(2, octave);
				break;
			case "C":
				frequency = 130.8 * Math.pow(2, octave);
				break;
			case "C#":
				frequency = 138.6 * Math.pow(2, octave);
				break;
			case "D":
				frequency = 146.8 * Math.pow(2, octave);
				break;
			case "D#":
				frequency = 155.6 * Math.pow(2, octave);
				break;
			case "E":
				frequency = 164.8 * Math.pow(2, octave);
				break;
			case "F":
				frequency = 174.6 * Math.pow(2, octave);
				break;
			case "F#":
				frequency = 185 * Math.pow(2, octave);
				break;
			case "G":
				frequency = 195 * Math.pow(2, octave);
				break;
			case "G#":
				frequency = 207.7 * Math.pow(2, octave);
				break;
		}

		var osc1 = context.createOscillator();
		osc1.type = "sawtooth";
		osc1.frequency.value = frequency;
		osc1.connect(self.Poly.SawGain);

		var osc2 = context.createOscillator();
		osc2.type = "square";
		osc2.frequency.value = frequency;
		osc2.connect(self.Poly.SquareGain);

		var oscillators = [osc1, osc2];
		this.Trigger = function(at) {
			for (var i = 0; i < oscillators.length; i++) {
				oscillators[i].start(at);
				oscillators[i].stop(at + .1);
			}
		}
	};

	this.Poly.LoadSequence = function(sequence) {
		$(".poly-sequencer-lane > .note").data("on", 0);

		for (var i = 0; i < sequence.length; i++) {
			$($("#poly-lane-" + sequence[i].what.toString().replace(/#/, "s").toLowerCase() + " > .note")[sequence[i].when - 1]).data("on", sequence[i].when);
			$($("#poly-lane-" + sequence[i].what.toString().replace(/#/, "s").toLowerCase() + " > .note")[sequence[i].when - 1]).css("background-color", ColorRed);
		}
	};

	var self = this;

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

	this.LoadSequence = function(context, tempo) {
		// assume 16th notes for the time being.
		var tickTime = 60 / tempo / 4;
		var t = false;
		$("#sequencer-start").click(function() {
			var now = context.currentTime;

			notes = $(".poly-sequencer-lane > .note");
			for (var i = 0; i < notes.length; i++) {
				var d = $(notes[i]).data("note");
				var on = $(notes[i]).data("on");

				if (d && (on > 0)) {
					console.log(d);
					d.Trigger(now + ((on - 1) * tickTime));
				}
			}

//			t = setTimeout(function() {
//				$("#sequencer-start").click();	
//			}, tickTime * 16 * 1000);
		});

		$("#sequencer-stop").click(function() {
			clearTimeout(t);
		});
	}

	this.SetupUI = function(bus, drummachine, poly) {
		var master_knob_width = 50;
		var drum_control_knob_width = 50;
		var poly_control_knob_width = 50;

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


		// lead
//		$("#lead-saw-gain > input").knob({
//			"width": lead_control_knob_width,
//			"min": lead.SawGain.gain.minValue,
//			"max": lead.SawGain.gain.maxValue,
//			"value": lead.SawGain.gain.value,
//		});
//
//		$("#lead-square-gain > input").knob({
//			"width": lead_control_knob_width,
//			"min": lead.SquareGain.gain.minValue,
//			"max": lead.SquareGain.gain.maxValue,
//			"value": lead.SquareGain.gain.value,
//		});
//
//		$("#lead-saw-detune > input").knob({
//			"width": lead_control_knob_width,
//			"min": -100,
//			"max": 0,
//			"value": lead.SawDetune,
//		});
//
//		$("#lead-square-detune > input").knob({
//			"width": lead_control_knob_width,
//			"min": -100,
//			"max": 0,
//			"value": lead.SquareDetune,
//		});
//
//		$("#lead-filter-freq > input").knob({
//			"width": lead_control_knob_width,
//			"min": lead.LP.frequency.minValue,
//			"max": lead.LP.frequency.maxValue,
//			"value": lead.LP.frequency.value,
//		});
//
//		$("#lead-filter-q > input").knob({
//			"width": lead_control_knob_width,
//			"min": lead.LP.Q.minValue,
//			"max": lead.LP.Q.maxValue,
//			"value": lead.LP.Q.value,
//		});
	}
}
