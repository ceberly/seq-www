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
	Bus = {
		Gain: outputContext.createGain(),
		// reverb isn't working right now.
		//var reverb: outputContext.createConvolver(),
		//reverb.connect(gain),
		Delay: outputContext.createDelay(),

		Dist: outputContext.createWaveShaper(),

		Comp: outputContext.createDynamicsCompressor(),

		HighShelf: outputContext.createBiquadFilter(),
		HighShelf.type: "highshelf",
		HighShelf.frequency.value: 8000,

		Peaking: outputContext.createBiquadFilter(),
		Peaking.type: "peaking",
		Peaking.frequency.value: 1200,

		LowShelf: outputContext.createBiquadFilter(),
		LowShelf.type: "lowshelf",
		LowShelf.frequency.value: 100,

		input: LowShelf,
	};

	Bus.HighShelf.type = "highshelf";
	Bus.HighShelf.frequency.value = 8000;

	Bus.Peaking.type: "peaking",
	Bus.Peaking.frequency.value: 1200,

	Bus.LowShelf.type: "lowshelf",
	LowShelf.frequency.value: 100,

	Dist.amount: 0;
	Bus.Gain.connect(context.destination);
	Bus.Delay.connect(Bus.Gain);
	Bus.Dist.connect(Bus.Delay);
	Bus.Comp.connect(Bus.Dist);
	Bus.HighShelf.connect(Bus.Comp);
	Bus.Peaking.connect(Bus.HighShelf);
	LowShelf.connect(Bus.Peaking);

	DrumMachine = {
		BD: {
			    notes: bus.context.createGain(),
			    notes.gain.value: 0,

			    osc1: bus.context.createOscillator(),
			    osc1.frequency.value: 62,
			    Trigger: function(at) {
				    notes.gain.exponentialRampToValueAtTime(1, at); // should be a function of overall gain
				    notes.gain.linearRampToValueAtTime(0, at + .5);
			    },
		    },
		SD: {
			    notes: bus.context.createGain(),
			    notes.gain.value: 0,

			    osc1: bus.context.createOscillator(),
			    osc1.frequency.value: 62,
			    Trigger: function(at) {
				    notes.gain.exponentialRampToValueAtTime(1, at); // should be a function of overall gain
				    notes.gain.linearRampToValueAtTime(0, at + .5);
			    },
		    },
		OH: {
			    notes: bus.context.createGain(),
			    notes.gain.value: 0,

			    osc1: bus.context.createOscillator(),
			    osc1.frequency.value: 62,
			    Trigger: function(at) {
				    notes.gain.exponentialRampToValueAtTime(1, at); // should be a function of overall gain
				    notes.gain.linearRampToValueAtTime(0, at + .5);
			    },
		    },
		CH: {
			    notes: bus.context.createGain(),
			    notes.gain.value: 0,

			    osc1: bus.context.createOscillator(),
			    osc1.frequency.value: 62,
			    Trigger: function(at) {
				    notes.gain.exponentialRampToValueAtTime(1, at); // should be a function of overall gain
				    notes.gain.linearRampToValueAtTime(0, at + .5);
			    },
		    },
		LoadSequence: function(sequence) {
				      $(".drummachine-lane > .note").data("on", false);
				      for (var i = 0; i < sequence.length; i++) {
					      switch (sequence[i].what) {
						      case DrumSound.BD:
							      $($("#drummachine-sequencer-bd > .note")[sequence[i].when - 1]).data("on", true);
							      $($("#drummachine-sequencer-bd > .note")[sequence[i].when - 1]).css("background-color", "red");
							      break;
						      case DrumSound.SD:
							      $($("#drummachine-sequencer-sd > .note")[sequence[i].when - 1]).data("on", true);
							      $($("#drummachine-sequencer-sd > .note")[sequence[i].when - 1]).css("background-color", "red");
							      break;
						      case DrumSound.CH:
							      $($("#drummachine-sequencer-ch > .note")[sequence[i].when - 1]).data("on", true);
							      $($("#drummachine-sequencer-ch > .note")[sequence[i].when - 1]).css("background-color", "red");
							      break;
						      case DrumSound.OH:
							      $($("#drummachine-sequencer-oh > .note")[sequence[i].when - 1]).data("on", true);
							      $($("#drummachine-sequencer-oh > .note")[sequence[i].when - 1]).css("background-color", "red");
							      break;
						      default:
							      console.log("Unexpected drum sound: " + sequence[i].what.toString());
					      }
				      }
			      },
	}

	BD.notes.connect(Bus.input);
	BD.osc1.connect(BD.notes);
	BD.osc1.start(0);
	SD.notes.connect(Bus.input);
	SD.osc1.connect(SD.notes);
	SD.osc1.start(0);
	OH.notes.connect(Bus.input);
	OH.osc1.connect(OH.notes);
	OH.osc1.start(0);
	CH.notes.connect(Bus.input);
	CH.osc1.connect(CH.notes);
	CH.osc1.start(0);

	for (var i = 0; i < 16; i++) {
		$("#drummachine-sequencer-oh").append('<button class="note"></button>').data("note", DrumMachine.OH);
		$("#drummachine-sequencer-ch").append('<button class="note"></button>').data("note", DrumMachine.CH);
		$("#drummachine-sequencer-sd").append('<button class="note"></button>').data("note", DrumMachine.SD);
		$("#drummachine-sequencer-bd").append('<button class="note"></button>').data("note", DrumMachine.BD);
	}

	Lead = function(bus) {
		var self = this;

		self.LP = bus.context.createBiquadFilter();
		self.LP.connect(bus.input);
		self.LP.frequency.value = 5000;
		self.LP.Q.value = 1;

		self.SawGain = bus.context.createGain();
		self.SawGain.connect(self.LP);

		self.SquareGain = bus.context.createGain();
		self.SquareGain.connect(self.LP);

		self.SawDetune = 0;
		self.SquareDetune = 0;

		self.Note = function(canonical, octave) {
			this.osc = function(frequency) {
				var osc1 = bus.context.createOscillator();
				osc1.type = "sawtooth";
				osc1.frequency.value = frequency;
				osc1.detune.value = self.SawDetune;
				osc1.connect(self.SawGain);

				var osc2 = bus.context.createOscillator();
				osc2.type = "square";
				osc2.frequency.value = frequency;
				osc2.detune.value = self.SquareDetune;
				osc2.connect(self.SquareGain);

				return [osc1, osc2];
			}

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

			this.frequency = frequency;

			this.Trigger = function(at) {
				var osc = new this.osc(frequency);
				for (var i = 0; i < osc.length; i++) {
					osc[i].start(at);
					osc[i].stop(at + .1);
				}
			}

			this.toString = function() {
				return canonical;
			}
		}

		self.Sequence = [];

		self.LoadSequence = function(sequence) {
			self.Sequence = sequence;

			for (var i = 0; i < sequence.length; i++) {
				$("#lead-note-" + sequence[i].what.toString().replace(/#/, "s").toLowerCase() + sequence[i].when).data("note", sequence[i]);
				$("#lead-note-" + sequence[i].what.toString().replace(/#/, "s").toLowerCase() + sequence[i].when).css("background-color", ColorRed);
			}
		}
	}

	function LoadSequence(context, drumMachine, lead, tempo) {
		// assume 16th notes for the time being.
		var tickTime = 60 / tempo / 4;
		var t = false;
		$("#sequencer-start").click(function() {
			var now = context.currentTime;

			notes = $(".note");
			for (var i = 0; i < notes.length; i++) {
				var d = $(notes[i]).data("note");
				var on = $(notes[i]).data("on");

				console.log(d);
				console.log(on);
				if (d && on) {
					d.what.Trigger(now + (d.when * tickTime));
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

	function SetupUI(bus, drummachine, lead) {
		var master_knob_width = 50;
		var drum_control_knob_width = 50;
		var lead_control_knob_width = 50;

		$("#master-gain > input").knob({
			"width": master_knob_width,
			"min": bus.Gain.gain.minValue * 100,
			"max": bus.Gain.gain.maxValue * 100,
			"value": bus.Gain.gain.value,
			"change": function(v) { bus.Gain.gain.value = (v / 100); }
		});

		$("#master-eq-high > input").knob({
			"width": master_knob_width,
			"min": bus.HighShelf.gain.minValue,
			"max": bus.HighShelf.gain.maxValue,
			"value": 0,
			"change": function(v) { bus.HighShelf.gain.value = v; }
		});

		$("#master-eq-low > input").knob({
			"width": master_knob_width,
			"min": bus.LowShelf.gain.minValue,
			"max": bus.LowShelf.gain.maxValue,
			"value": 0,
			"change": function(v) { bus.LowShelf.gain.value = v; }
		});

		$("#master-eq-mid > input").knob({
			"width": master_knob_width,
			"min": bus.Peaking.gain.minValue,
			"max": bus.Peaking.gain.maxValue,
			"value": 0,
			"change": function(v) { bus.Peaking.gain.value = v; }
		});

		$("#master-comp-threshold > input").knob({
			"width": master_knob_width,
			"min": bus.Comp.threshold.minValue,
			"max": bus.Comp.threshold.maxValue,
			"value": bus.Comp.threshold.value,
			"change": function(v) { bus.Comp.threshold.value = v; }
		});

		$("#master-comp-ratio > input").knob({
			"width": master_knob_width,
			"min": bus.Comp.ratio.minValue,
			"max": bus.Comp.ratio.maxValue,
			"value": bus.Comp.ratio.value,
			"change": function(v) { bus.Comp.ratio.value = v; }
		});

		$("#master-comp-attack > input").knob({
			"width": master_knob_width,
			"min": bus.Comp.attack.minValue,
			"max": bus.Comp.attack.maxValue,
			"value": bus.Comp.attack.value,
			"change": function(v) { bus.Comp.attack.value = v; }
		});

		$("#master-comp-release > input").knob({
			"width": master_knob_width,
			"min": bus.Comp.release.minValue,
			"max": bus.Comp.release.maxValue,
			"value": bus.Comp.release.value,
			"change": function(v) { bus.Comp.release.value = v; }
		});

		$("#master-dist-amount > input").knob({
			"width": master_knob_width,
			"min": 0,
			"max": 100,
			"value": bus.Dist.amount,
			"change": function(v) { bus.Dist.amount = v; }
		});



		// drummmachine controls
		$("#drummachine-controls-bd-decay > input").knob({
			"width": drum_control_knob_width,
			"min": 0,
			"max": 100,
			"value": 0,
		});


		// lead
		$("#lead-saw-gain > input").knob({
			"width": lead_control_knob_width,
			"min": lead.SawGain.gain.minValue,
			"max": lead.SawGain.gain.maxValue,
			"value": lead.SawGain.gain.value,
		});

		$("#lead-square-gain > input").knob({
			"width": lead_control_knob_width,
			"min": lead.SquareGain.gain.minValue,
			"max": lead.SquareGain.gain.maxValue,
			"value": lead.SquareGain.gain.value,
		});

		$("#lead-saw-detune > input").knob({
			"width": lead_control_knob_width,
			"min": -100,
			"max": 0,
			"value": lead.SawDetune,
		});

		$("#lead-square-detune > input").knob({
			"width": lead_control_knob_width,
			"min": -100,
			"max": 0,
			"value": lead.SquareDetune,
		});

		$("#lead-filter-freq > input").knob({
			"width": lead_control_knob_width,
			"min": lead.LP.frequency.minValue,
			"max": lead.LP.frequency.maxValue,
			"value": lead.LP.frequency.value,
		});

		$("#lead-filter-q > input").knob({
			"width": lead_control_knob_width,
			"min": lead.LP.Q.minValue,
			"max": lead.LP.Q.maxValue,
			"value": lead.LP.Q.value,
		});
	}
}
