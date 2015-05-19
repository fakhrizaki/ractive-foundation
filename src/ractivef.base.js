RactiveF = {
	components: {},
	templates: {},
	widgets: [],
	initInstance: function (container) {

		// Have we mixed in extensions to all instances yet?
		if (!Ractive.prototype.findAllChildComponents) {
			_.mixin(Ractive.prototype, RactiveF.mixins);
		}

		var instance = new Ractive({
			el: container,
			template: Ractive.parse(container.innerHTML),
			components: RactiveF.components,
			onrender: function () {
				this.el.classList.remove('hide');
				this.el.classList.add('initialize');
			}
		});

		instance.on('*.*', RactiveF.genericEventHandler);

		instance.set('dataModel', '{{dataModel}}');

		return instance;
	},

	genericEventHandler: function (origin) {

		// list of events below copied from Ractive source code v0.7.1
		// Filtering out ractive lifecycle events to not pollute log output.
		var reservedEventNames =
				/^(?:change|complete|reset|teardown|update|construct|config|init|render|unrender|detach|insert)$/;

		if (!reservedEventNames.test(this.event.name)) {
			console.log('Event', this.event.name);
			console.log('Event handler arguments', origin);

			var eventName = 'events.' + origin.get('uid');
			if (!this.get(eventName)) {
				this.set(eventName, []);
			}
			this.push(eventName, this.event.name);
		}

	},

	mixins: {

		/**
		 * Get the current coordinates of the given element, relative to the document.
		 *
		 * Useful for viewport checks etc
		 *
		 * Use Ractive's this.find(selector) to pass that element in.
		 *
		 * Helper function for cross-browser element offset.
		 * window.pageYOffset is not supported below IE 9.
		 *
		 * FIXME Where should this belong?
		 */
		elementOffset: function (elem) {

			var box = elem.getBoundingClientRect();

			var body = document.body;
			var docEl = document.documentElement;
			var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
			var clientTop = docEl.clientTop || body.clientTop || 0;

			var top = box.top + (scrollTop - clientTop);
			var pageXOffset = window.pageXOffset || document.documentElement.scrollLeft;

			return {
				top: Math.round(top),
				right: Math.round(box.right + pageXOffset),
				bottom: Math.round(box.bottom + top),
				left: Math.round(box.left + pageXOffset)
			};

		},

		/**
		 * IE8 friendly function.
		 * TODO Make the return object the same as offset?
		 */
		pageYOffset: function () {
			return window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop;
		},

		/*
		 * When working with nested components we only want to find child
		 * components, not all decendants.
		 * @param name
		 */
		findAllChildComponents: function (name) {
			return _.filter(this.findAllComponents(name), function (component) {
				return this._guid === component.parent._guid;
			}.bind(this));
		},

		/**
		 * If we have a "datamodel" property, that should override any other data.
		 * This is now a "data-driven" component.
		 * isDataModel is a flag for hbs logic, on whether to use datamodel data or call {{yield}}.
		 * @see http://docs.ractivejs.org/latest/ractive-reset
		 *
		 * TODO Understand the difference between rendering components off the page vs nested inside others.
		 * onconstruct has empty opts for the latter.
		 */
		onconstruct: function (opts) {
			if (opts.data && opts.data.datamodel) {
				var datamodel = _.cloneDeep(opts.data.datamodel);
				datamodel.isDataModel = true;
				opts.data = _.assign(opts.data, datamodel);
				delete opts.data.datamodel;
			}
		},

		/**
		 * For any data-driven component - if something sets 'datamodel', lift that into root scope.
		 */
		onrender: function () {

			// Wait for parent component to set "datamodel" and then map that back into data again.
			this.observe('datamodel', function (newDataModel) {
				if (newDataModel) {
					// Lift datamodel data into root data scope.
					this.set(newDataModel);
				}
			});

		}
	}

};
