
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }
    function set_style(node, key, value) {
        node.style.setProperty(key, value);
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.shift()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            while (render_callbacks.length) {
                const callback = render_callbacks.pop();
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_render);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_render.forEach(add_render_callback);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_render } = component.$$;
        fragment.m(target, anchor);
        // onMount happens after the initial afterUpdate. Because
        // afterUpdate callbacks happen in reverse order (inner first)
        // we schedule onMount callbacks before afterUpdate callbacks
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_render.forEach(add_render_callback);
    }
    function destroy(component, detaching) {
        if (component.$$) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal: not_equal$$1,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_render: [],
            after_render: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_render);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro && component.$$.fragment.i)
                component.$$.fragment.i();
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy(this, true);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src\App.svelte generated by Svelte v3.5.1 */

    const file = "src\\App.svelte";

    // (166:0) {:else}
    function create_else_block(ctx) {
    	var p;

    	return {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Длина между 5 и 10";
    			add_location(p, file, 166, 4, 3403);
    		},

    		m: function mount(target, anchor) {
    			insert(target, p, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(p);
    			}
    		}
    	};
    }

    // (164:29) 
    function create_if_block_1(ctx) {
    	var p;

    	return {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Длинна больше 10 символов";
    			add_location(p, file, 164, 4, 3358);
    		},

    		m: function mount(target, anchor) {
    			insert(target, p, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(p);
    			}
    		}
    	};
    }

    // (162:0) {#if value4.length < 5}
    function create_if_block(ctx) {
    	var p;

    	return {
    		c: function create() {
    			p = element("p");
    			p.textContent = "длина меньше 5 символов";
    			add_location(p, file, 162, 4, 3293);
    		},

    		m: function mount(target, anchor) {
    			insert(target, p, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(p);
    			}
    		}
    	};
    }

    function create_fragment(ctx) {
    	var h10, t0, t1, t2, t3, h20, t4_value = ctx.name.toUpperCase(), t4, t5, h21, t6_value = (Math.random() * number).toFixed(3), t6, t7, img, t8, p, t9, button0, t11, div0, h22, t12, t13_value = ctx.pos.x, t13, t14, t15_value = ctx.pos.y, t15, t16, form, input0, t17, button1, t19, h11, t20, t21, h12, t22, t23, h13, t24, t25, button2, t27, h14, t28, t29, t30, button3, t32, h15, t33, t34, input1, t35, hr0, t36, input2, t37, t38, t39, hr1, t40, textarea, t41, div1, t42, t43, hr2, t44, select_1, option0, option1, option2, t48, hr3, t49, input3, t50, input4, t51, br, t52, t53, t54, input5, t55, if_block_anchor, dispose;

    	function select_block_type(ctx) {
    		if (ctx.value4.length < 5) return create_if_block;
    		if (ctx.value4.length > 10) return create_if_block_1;
    		return create_else_block;
    	}

    	var current_block_type = select_block_type(ctx);
    	var if_block = current_block_type(ctx);

    	return {
    		c: function create() {
    			h10 = element("h1");
    			t0 = text("Hello ");
    			t1 = text(ctx.name);
    			t2 = text("!");
    			t3 = space();
    			h20 = element("h2");
    			t4 = text(t4_value);
    			t5 = space();
    			h21 = element("h2");
    			t6 = text(t6_value);
    			t7 = space();
    			img = element("img");
    			t8 = space();
    			p = element("p");
    			t9 = space();
    			button0 = element("button");
    			button0.textContent = "Change name";
    			t11 = space();
    			div0 = element("div");
    			h22 = element("h2");
    			t12 = text("x: ");
    			t13 = text(t13_value);
    			t14 = text(", y: ");
    			t15 = text(t15_value);
    			t16 = space();
    			form = element("form");
    			input0 = element("input");
    			t17 = space();
    			button1 = element("button");
    			button1.textContent = "Submit form";
    			t19 = space();
    			h11 = element("h1");
    			t20 = text(ctx.name2);
    			t21 = space();
    			h12 = element("h1");
    			t22 = text(ctx.upperName);
    			t23 = space();
    			h13 = element("h1");
    			t24 = text(ctx.lowerName);
    			t25 = space();
    			button2 = element("button");
    			button2.textContent = "Change name";
    			t27 = space();
    			h14 = element("h1");
    			t28 = text("Counter");
    			t29 = text(ctx.counter);
    			t30 = space();
    			button3 = element("button");
    			button3.textContent = "Add 1 to counter";
    			t32 = space();
    			h15 = element("h1");
    			t33 = text(ctx.name);
    			t34 = space();
    			input1 = element("input");
    			t35 = space();
    			hr0 = element("hr");
    			t36 = space();
    			input2 = element("input");
    			t37 = space();
    			t38 = text(ctx.agree);
    			t39 = space();
    			hr1 = element("hr");
    			t40 = space();
    			textarea = element("textarea");
    			t41 = space();
    			div1 = element("div");
    			t42 = text(ctx.text);
    			t43 = space();
    			hr2 = element("hr");
    			t44 = space();
    			select_1 = element("select");
    			option0 = element("option");
    			option0.textContent = "Option 0";
    			option1 = element("option");
    			option1.textContent = "Option 1";
    			option2 = element("option");
    			option2.textContent = "Option 2";
    			t48 = space();
    			hr3 = element("hr");
    			t49 = space();
    			input3 = element("input");
    			t50 = text("Female\n");
    			input4 = element("input");
    			t51 = text("Male\n");
    			br = element("br");
    			t52 = text("\nSex: ");
    			t53 = text(ctx.sex);
    			t54 = space();
    			input5 = element("input");
    			t55 = space();
    			if_block.c();
    			if_block_anchor = empty();
    			add_location(h10, file, 103, 0, 1806);
    			add_location(h20, file, 104, 0, 1829);
    			add_location(h21, file, 105, 0, 1859);
    			img.src = src;
    			img.alt = altText;
    			img.className = "svelte-1d8mmm";
    			add_location(img, file, 109, 0, 1976);
    			add_location(p, file, 112, 0, 2023);
    			add_location(button0, file, 114, 0, 2050);
    			add_location(h22, file, 116, 4, 2162);
    			div0.className = "playground svelte-1d8mmm";
    			add_location(div0, file, 115, 0, 2101);
    			attr(input0, "type", "text");
    			add_location(input0, file, 122, 4, 2287);
    			button1.type = "submit";
    			add_location(button1, file, 123, 4, 2350);
    			add_location(form, file, 121, 0, 2250);
    			add_location(h11, file, 129, 0, 2421);
    			add_location(h12, file, 130, 0, 2438);
    			add_location(h13, file, 131, 0, 2459);
    			add_location(button2, file, 133, 0, 2481);
    			h14.className = "" + ctx.counterClass + " svelte-1d8mmm";
    			add_location(h14, file, 135, 0, 2536);
    			add_location(button3, file, 136, 0, 2584);
    			add_location(h15, file, 139, 0, 2663);
    			attr(input1, "type", "text");
    			add_location(input1, file, 140, 0, 2679);
    			add_location(hr0, file, 141, 0, 2719);
    			attr(input2, "type", "checkbox");
    			add_location(input2, file, 142, 0, 2725);
    			add_location(hr1, file, 143, 0, 2779);
    			add_location(textarea, file, 144, 0, 2785);
    			set_style(div1, "white-space", "pre-wrap");
    			add_location(div1, file, 145, 0, 2815);
    			add_location(hr2, file, 146, 0, 2863);
    			option0.__value = "0";
    			option0.value = option0.__value;
    			add_location(option0, file, 148, 4, 2902);
    			option1.__value = "1";
    			option1.value = option1.__value;
    			add_location(option1, file, 149, 4, 2942);
    			option2.__value = "2";
    			option2.value = option2.__value;
    			add_location(option2, file, 150, 4, 2982);
    			if (ctx.select === void 0) add_render_callback(() => ctx.select_1_change_handler.call(select_1));
    			add_location(select_1, file, 147, 0, 2869);
    			add_location(hr3, file, 152, 0, 3028);
    			ctx.$$binding_groups[0].push(input3);
    			attr(input3, "type", "radio");
    			input3.__value = "female";
    			input3.value = input3.__value;
    			add_location(input3, file, 153, 0, 3035);
    			ctx.$$binding_groups[0].push(input4);
    			attr(input4, "type", "radio");
    			input4.__value = "male";
    			input4.value = input4.__value;
    			add_location(input4, file, 154, 0, 3094);
    			add_location(br, file, 155, 0, 3149);
    			attr(input5, "type", "text");
    			input5.className = "svelte-1d8mmm";
    			toggle_class(input5, "red4", ctx.error);
    			toggle_class(input5, "green", !ctx.error);
    			add_location(input5, file, 159, 0, 3184);

    			dispose = [
    				listen(button0, "click", ctx.changeName),
    				listen(div0, "mousemove", ctx.mousemoveHandler),
    				listen(input0, "input", input_handler),
    				listen(form, "submit", submitHandler),
    				listen(button2, "click", ctx.changeName2),
    				listen(button3, "click", ctx.click_handler),
    				listen(input1, "input", ctx.input1_input_handler),
    				listen(input2, "change", ctx.input2_change_handler),
    				listen(textarea, "input", ctx.textarea_input_handler),
    				listen(select_1, "change", ctx.select_1_change_handler),
    				listen(input3, "change", ctx.input3_change_handler),
    				listen(input4, "change", ctx.input4_change_handler),
    				listen(input5, "input", ctx.input5_input_handler)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, h10, anchor);
    			append(h10, t0);
    			append(h10, t1);
    			append(h10, t2);
    			insert(target, t3, anchor);
    			insert(target, h20, anchor);
    			append(h20, t4);
    			insert(target, t5, anchor);
    			insert(target, h21, anchor);
    			append(h21, t6);
    			insert(target, t7, anchor);
    			insert(target, img, anchor);
    			insert(target, t8, anchor);
    			insert(target, p, anchor);
    			p.innerHTML = htmlString;
    			insert(target, t9, anchor);
    			insert(target, button0, anchor);
    			insert(target, t11, anchor);
    			insert(target, div0, anchor);
    			append(div0, h22);
    			append(h22, t12);
    			append(h22, t13);
    			append(h22, t14);
    			append(h22, t15);
    			insert(target, t16, anchor);
    			insert(target, form, anchor);
    			append(form, input0);
    			append(form, t17);
    			append(form, button1);
    			insert(target, t19, anchor);
    			insert(target, h11, anchor);
    			append(h11, t20);
    			insert(target, t21, anchor);
    			insert(target, h12, anchor);
    			append(h12, t22);
    			insert(target, t23, anchor);
    			insert(target, h13, anchor);
    			append(h13, t24);
    			insert(target, t25, anchor);
    			insert(target, button2, anchor);
    			insert(target, t27, anchor);
    			insert(target, h14, anchor);
    			append(h14, t28);
    			append(h14, t29);
    			insert(target, t30, anchor);
    			insert(target, button3, anchor);
    			insert(target, t32, anchor);
    			insert(target, h15, anchor);
    			append(h15, t33);
    			insert(target, t34, anchor);
    			insert(target, input1, anchor);

    			input1.value = ctx.name;

    			insert(target, t35, anchor);
    			insert(target, hr0, anchor);
    			insert(target, t36, anchor);
    			insert(target, input2, anchor);

    			input2.checked = ctx.agree;

    			insert(target, t37, anchor);
    			insert(target, t38, anchor);
    			insert(target, t39, anchor);
    			insert(target, hr1, anchor);
    			insert(target, t40, anchor);
    			insert(target, textarea, anchor);

    			textarea.value = ctx.text;

    			insert(target, t41, anchor);
    			insert(target, div1, anchor);
    			append(div1, t42);
    			insert(target, t43, anchor);
    			insert(target, hr2, anchor);
    			insert(target, t44, anchor);
    			insert(target, select_1, anchor);
    			append(select_1, option0);
    			append(select_1, option1);
    			append(select_1, option2);

    			select_option(select_1, ctx.select);

    			insert(target, t48, anchor);
    			insert(target, hr3, anchor);
    			insert(target, t49, anchor);
    			insert(target, input3, anchor);

    			input3.checked = input3.__value === ctx.sex;

    			insert(target, t50, anchor);
    			insert(target, input4, anchor);

    			input4.checked = input4.__value === ctx.sex;

    			insert(target, t51, anchor);
    			insert(target, br, anchor);
    			insert(target, t52, anchor);
    			insert(target, t53, anchor);
    			insert(target, t54, anchor);
    			insert(target, input5, anchor);

    			input5.value = ctx.value4;

    			insert(target, t55, anchor);
    			if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (changed.name) {
    				set_data(t1, ctx.name);
    			}

    			if ((changed.name) && t4_value !== (t4_value = ctx.name.toUpperCase())) {
    				set_data(t4, t4_value);
    			}

    			if ((changed.pos) && t13_value !== (t13_value = ctx.pos.x)) {
    				set_data(t13, t13_value);
    			}

    			if ((changed.pos) && t15_value !== (t15_value = ctx.pos.y)) {
    				set_data(t15, t15_value);
    			}

    			if (changed.name2) {
    				set_data(t20, ctx.name2);
    			}

    			if (changed.upperName) {
    				set_data(t22, ctx.upperName);
    			}

    			if (changed.lowerName) {
    				set_data(t24, ctx.lowerName);
    			}

    			if (changed.counter) {
    				set_data(t29, ctx.counter);
    			}

    			if (changed.counterClass) {
    				h14.className = "" + ctx.counterClass + " svelte-1d8mmm";
    			}

    			if (changed.name) {
    				set_data(t33, ctx.name);
    			}

    			if (changed.name && (input1.value !== ctx.name)) input1.value = ctx.name;
    			if (changed.agree) input2.checked = ctx.agree;

    			if (changed.agree) {
    				set_data(t38, ctx.agree);
    			}

    			if (changed.text) textarea.value = ctx.text;

    			if (changed.text) {
    				set_data(t42, ctx.text);
    			}

    			if (changed.select) select_option(select_1, ctx.select);
    			if (changed.sex) input3.checked = input3.__value === ctx.sex;
    			if (changed.sex) input4.checked = input4.__value === ctx.sex;

    			if (changed.sex) {
    				set_data(t53, ctx.sex);
    			}

    			if (changed.value4 && (input5.value !== ctx.value4)) input5.value = ctx.value4;

    			if (changed.error) {
    				toggle_class(input5, "red4", ctx.error);
    				toggle_class(input5, "green", !ctx.error);
    			}

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);
    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(h10);
    				detach(t3);
    				detach(h20);
    				detach(t5);
    				detach(h21);
    				detach(t7);
    				detach(img);
    				detach(t8);
    				detach(p);
    				detach(t9);
    				detach(button0);
    				detach(t11);
    				detach(div0);
    				detach(t16);
    				detach(form);
    				detach(t19);
    				detach(h11);
    				detach(t21);
    				detach(h12);
    				detach(t23);
    				detach(h13);
    				detach(t25);
    				detach(button2);
    				detach(t27);
    				detach(h14);
    				detach(t30);
    				detach(button3);
    				detach(t32);
    				detach(h15);
    				detach(t34);
    				detach(input1);
    				detach(t35);
    				detach(hr0);
    				detach(t36);
    				detach(input2);
    				detach(t37);
    				detach(t38);
    				detach(t39);
    				detach(hr1);
    				detach(t40);
    				detach(textarea);
    				detach(t41);
    				detach(div1);
    				detach(t43);
    				detach(hr2);
    				detach(t44);
    				detach(select_1);
    				detach(t48);
    				detach(hr3);
    				detach(t49);
    				detach(input3);
    			}

    			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input3), 1);

    			if (detaching) {
    				detach(t50);
    				detach(input4);
    			}

    			ctx.$$binding_groups[0].splice(ctx.$$binding_groups[0].indexOf(input4), 1);

    			if (detaching) {
    				detach(t51);
    				detach(br);
    				detach(t52);
    				detach(t53);
    				detach(t54);
    				detach(input5);
    				detach(t55);
    			}

    			if_block.d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}

    			run_all(dispose);
    		}
    	};
    }

    let altText = 'Rich Harris';

    let src = 'https://images.app.goo.gl/RRtDjhEwXDPSJyRaA';

    let number = 42;

    let htmlString = "<b>This is strong text</b> with <em>italic text</em>";

    let inputValue = 'input';

    function submitHandler(event) {
        // event.preventDefault для остановки
        event.preventDefault();
        console.log(inputValue);
    	}

    function isValid(val) {
        return val.length > 5 && val.length < 10;
    }

    function input_handler(event) {
    	return event.target.value;
    }

    function instance($$self, $$props, $$invalidate) {
    	let name = 'name';
    	let pos = {
    	    x : 0,
    	    y : 0
    	};


    	function changeName() {
            $$invalidate('name', name = 'Changed name');
    	}
    	function mousemoveHandler(event) {
    	    pos.x = event.x; $$invalidate('pos', pos);
    	    pos.y = event.y; $$invalidate('pos', pos);
    	}


    	///////////////////////////// lesson 2


    	let name2 = "svelte";
        let counter = 0;

        function changeName2() {
            $$invalidate('name', name = "New name");
        }
        let agree = false;
        let text = "";
        let select = "2";
        let sex = "male";

        ///////////////////////////// lesson 4

        let value4 = "Hello";

    	const $$binding_groups = [[]];

    	function click_handler() {
    		const $$result = counter++;
    		$$invalidate('counter', counter);
    		return $$result;
    	}

    	function input1_input_handler() {
    		name = this.value;
    		$$invalidate('name', name);
    	}

    	function input2_change_handler() {
    		agree = this.checked;
    		$$invalidate('agree', agree);
    	}

    	function textarea_input_handler() {
    		text = this.value;
    		$$invalidate('text', text);
    	}

    	function select_1_change_handler() {
    		select = select_value(this);
    		$$invalidate('select', select);
    	}

    	function input3_change_handler() {
    		sex = this.__value;
    		$$invalidate('sex', sex);
    	}

    	function input4_change_handler() {
    		sex = this.__value;
    		$$invalidate('sex', sex);
    	}

    	function input5_input_handler() {
    		value4 = this.value;
    		$$invalidate('value4', value4);
    	}

    	let counterClass, upperName, lowerName, error;

    	$$self.$$.update = ($$dirty = { counter: 1, name: 1, name2: 1, value4: 1 }) => {
    		if ($$dirty.counter) { $$invalidate('counterClass', counterClass = counter % 2 === 0 ? "red" : "blue"); }
    		if ($$dirty.name) { $$invalidate('upperName', upperName = name.toUpperCase()); }
    		if ($$dirty.name) { $$invalidate('lowerName', lowerName = name.toLowerCase()); }
    		if ($$dirty.counter) { if (counter === 10) {
                    $$invalidate('name2', name2 = "counter is equal 10");
                } }
    		if ($$dirty.name2 || $$dirty.counter) { {
                    console.log("Name", name2);
                    console.log("Counter", counter);
                } }
    		if ($$dirty.value4) { $$invalidate('error', error = !isValid(value4)); }
    	};

    	return {
    		name,
    		pos,
    		changeName,
    		mousemoveHandler,
    		name2,
    		counter,
    		changeName2,
    		agree,
    		text,
    		select,
    		sex,
    		value4,
    		counterClass,
    		upperName,
    		lowerName,
    		error,
    		click_handler,
    		input1_input_handler,
    		input2_change_handler,
    		textarea_input_handler,
    		select_1_change_handler,
    		input3_change_handler,
    		input4_change_handler,
    		input5_input_handler,
    		$$binding_groups
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, []);
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
