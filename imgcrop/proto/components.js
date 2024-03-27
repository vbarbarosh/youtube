Vue.component('input-files', {
    props: ['value'],
    template: `
        <div v-on:dragover="dragover" v-on:dragleave="dragleave" v-on:drop="drop" v-bind:class="{green: is_allowed, red: is_disallowed}" class="flex-col-center min-h200 dashed" style="border-width:3px;">
            <h2 class="flex-row-center">
                Drop files here
            </h2>
            <div class="oa max-ww max-hh">
                <table v-if="(value && value.length)">
                    <tr v-for="item in value" v-on:click="click_tr(item)" v-bind:class="{green: item.is_active}">
                        <td><button v-on:click="click_remove(item)">✗</button></td>
                        <td><img-file v-bind:value="item.file" class="max-w50 max-h50" /></td>
                        <td>{{ item.file.name }}</td>
                        <td>{{ item.file.size }}</td>
                        <td>{{ item.file.type }}</td>
                    </tr>
                </table>
            </div>
        </div>
    `,
    data: function () {
        return {
            dragfiles: null,
        };
    },
    computed: {
        is_allowed: function () {
            return this.dragfiles && (this.dragfiles.length > 0);
        },
        is_disallowed: function () {
            return this.dragfiles && (this.dragfiles.length === 0);
        },
    },
    methods: {
        dragover: function (event) {
            event.preventDefault();
            // At this stage only `kind` and `type` attributes are allowed. Reading content
            // of a file will be allowed at `drop` event only.
            this.dragfiles = [...event.dataTransfer.items].filter(v => v.kind === 'file');
        },
        dragleave: function (event) {
            this.dragfiles = null;
        },
        drop: function (event) {
            event.preventDefault();
            this.dragfiles = null;
            const files = [...event.dataTransfer.files];
            files.forEach(file => this.value.push({file, is_active: false, crop: make_croptype()}));
        },
        click_remove: function (item) {
            const i = this.value.indexOf(item);
            if (i !== -1) {
                this.value.splice(i, 1);
            }
        },
        click_tr: function (item) {
            this.value.forEach(v => v.is_active = (v === item));
        },
    },
});

const ___img_files = [];
___img_files.gc = function () {
    while (___img_files.length) {
        const i = ___img_files.findIndex(v => v.refs <= 0);
        if (i === -1) {
            break;
        }
        console.log('revokeObjectURL', ___img_files[i], ___img_files.length - 1);
        URL.revokeObjectURL(___img_files[i].url);
        ___img_files.splice(i, 1);
    }
};

Vue.component('img-file', {
    props: ['value'],
    template: `<img v-on="$listeners" v-bind:src="url" />`,
    data: function () {
        const blank = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
        return {
            blank,
            url: blank,
        };
    },
    watch: {
        value: {
            immediate: true,
            handler: function (next, prev) {
                (___img_files.find(v => v.file === prev)||0).refs--;
                const i = ___img_files.findIndex(v => v.file === next);
                switch ((this.value||0).type) {
                case 'image/bmp':
                case 'image/gif':
                case 'image/jpeg':
                case 'image/png':
                case 'image/svg+xml':
                case 'image/vnd.microsoft.icon':
                case 'image/webp':
                case 'image/x-icon':
                case 'image/x-win-bitmap':
                    if (i === -1) {
                        const url = URL.createObjectURL(this.value);
                        ___img_files.push({file: this.value, refs: 1, url});
                        this.url = url;
                    }
                    else {
                        ___img_files[i].refs++;
                        this.url = ___img_files[i].url;
                    }
                    break;
                default:
                    this.url = this.blank;
                }
                Vue.nextTick(___img_files.gc);
            },
        },
    },
    beforeDestroy: function () {
        const i = ___img_files.findIndex(v => v.file === this.value);
        if (i !== -1) {
            ___img_files[i].refs--;
            ___img_files.gc();
        }
    },
});

const CROPSIZE_WH = 50;

Vue.component('cropresize', {
    props: ['value', 'file'],
    template: `
        <div v-on:mousemove="mousemove" v-on:wheel="wheel" class="rel blue">
            <input v-model="value.zoom" type="range" min="0.01" max="5" step="0.01" class="abs-tr">
            <pre class="abs z1 no-pointer-events">{{ {x,y,value} }}</pre>
            <img-file v-on:mousedown="mousedown_img" v-bind:value="file" v-bind:style="{transform: \`translate(\${value.ox}px,\${value.oy}px) scale(\${value.zoom}) \`}" style="transform-origin:0 0;" class="abs t0 l0" />
            <div v-on:mousedown="mousedown_selrect" v-bind:style="selrect_style" class="cropresize-selrect" />
            <div v-on:mousedown="mousedown_top" v-bind:style="selrect_top" class="cropresize-side" />
            <div v-on:mousedown="mousedown_left" v-bind:style="selrect_left" class="cropresize-side" />
            <div v-on:mousedown="mousedown_right" v-bind:style="selrect_right" class="cropresize-side" />
            <div v-on:mousedown="mousedown_bottom" v-bind:style="selrect_bottom" class="cropresize-side" />
            <div v-on:mousedown="mousedown_topleft" v-bind:style="selrect_topleft" class="cropresize-side" />
            <div v-on:mousedown="mousedown_topright" v-bind:style="selrect_topright" class="cropresize-side" />
            <div v-on:mousedown="mousedown_bottomleft" v-bind:style="selrect_bottomleft" class="cropresize-side" />
            <div v-on:mousedown="mousedown_bottomright" v-bind:style="selrect_bottomright" class="cropresize-side" />
        </div>
    `,
    data: function () {
        return {
            x: 0,
            y: 0,
        };
    },
    computed: {
        selrect_style: function () {
            return {
                top: px(this.value.y),
                left: px(this.value.x),
                width: px(this.value.w),
                height: px(this.value.h),
            };
        },
        selrect_top: function () {
            return {
                top: px(this.value.y - CROPSIZE_WH),
                left: px(this.value.x),
                width: px(this.value.w),
                height: px(CROPSIZE_WH),
            };
        },
        selrect_left: function () {
            return {
                top: px(this.value.y),
                left: px(this.value.x - CROPSIZE_WH),
                width: px(CROPSIZE_WH),
                height: px(this.value.h),
            };
        },
        selrect_right: function () {
            return {
                top: px(this.value.y),
                left: px(this.value.x + this.value.w),
                width: px(CROPSIZE_WH),
                height: px(this.value.h),
            };
        },
        selrect_bottom: function () {
            return {
                top: px(this.value.y + this.value.h),
                left: px(this.value.x),
                width: px(this.value.w),
                height: px(CROPSIZE_WH),
            };
        },
        selrect_topleft: function () {
            return {
                top: px(this.value.y - CROPSIZE_WH),
                left: px(this.value.x - CROPSIZE_WH),
                width: px(CROPSIZE_WH),
                height: px(CROPSIZE_WH),
            };
        },
        selrect_topright: function () {
            return {
                top: px(this.value.y - CROPSIZE_WH),
                left: px(this.value.x + this.value.w),
                width: px(CROPSIZE_WH),
                height: px(CROPSIZE_WH),
            };
        },
        selrect_bottomleft: function () {
            return {
                top: px(this.value.y + this.value.h),
                left: px(this.value.x - CROPSIZE_WH),
                width: px(CROPSIZE_WH),
                height: px(CROPSIZE_WH),
            };
        },
        selrect_bottomright: function () {
            return {
                top: px(this.value.y + this.value.h),
                left: px(this.value.x + this.value.w),
                width: px(CROPSIZE_WH),
                height: px(CROPSIZE_WH),
            };
        },
    },
    methods: {
        mousemove: function (event) {
            const r = this.$el.getBoundingClientRect();
            const x = event.clientX - r.left;
            const y = event.clientY - r.top;
            this.x = (x - this.value.ox)/this.value.zoom;
            this.y = (y - this.value.oy)/this.value.zoom;
        },
        wheel: function (event) {
            console.log('wheel', event);
            event.preventDefault();
            const prev = this.value.zoom;
            this.value.zoom = (+this.value.zoom) + (event.deltaY < 0 ? 0.05 : -0.05);
            const d = event.deltaY < 0 ? 0.05 : -0.05;
            const r = this.$el.getBoundingClientRect();
            const x = event.clientX - r.left;
            const y = event.clientY - r.top;
            this.value.ox += ((x - this.value.ox)/this.value.zoom - (x - this.value.ox)/prev)*this.value.zoom;
            this.value.oy += ((y - this.value.oy)/this.value.zoom - (y - this.value.oy)/prev)*this.value.zoom;
        },
        mousedown_img: function (event) {
            const _this = this;
            const {ox: ox0, oy: oy0} = this.value;
            event.preventDefault();
            dd({
                event,
                move: function (ctx) {
                    _this.value.ox = ox0 + ctx.dx;
                    _this.value.oy = oy0 + ctx.dy;
                    _this.mousemove(ctx.event);
                },
            });
        },
        mousedown_selrect: function (event) {
            const _this = this;
            const {x: x0, y: y0} = this.value;
            event.preventDefault();
            dd({
                event,
                move: function (ctx) {
                    _this.value.x = x0 + ctx.dx;
                    _this.value.y = y0 + ctx.dy;
                },
            });
        },
        mousedown_top: function (event) {
            const _this = this;
            const {x: x0, y: y0, w: w0, h: h0} = this.value;
            event.preventDefault();
            dd({
                event,
                move: function (ctx) {
                    _this.value.y = y0 + ctx.dy;
                    _this.value.h = h0 - ctx.dy;
                },
            });
        },
        mousedown_left: function (event) {
            const _this = this;
            const {x: x0, y: y0, w: w0} = this.value;
            event.preventDefault();
            dd({
                event,
                move: function (ctx) {
                    _this.value.x = x0 + ctx.dx;
                    _this.value.w = w0 - ctx.dx;
                },
            });
        },
        mousedown_right: function (event) {
            const _this = this;
            const {x: x0, y: y0, w: w0} = this.value;
            event.preventDefault();
            dd({
                event,
                move: function (ctx) {
                    _this.value.w = w0 + ctx.dx;
                },
            });
        },
        mousedown_bottom: function (event) {
            const _this = this;
            const {x: x0, y: y0, w: w0, h: h0} = this.value;
            event.preventDefault();
            dd({
                event,
                move: function (ctx) {
                    _this.value.h = h0 + ctx.dy;
                },
            });
        },
        mousedown_topleft: function (event) {
            const _this = this;
            const {x: x0, y: y0, w: w0, h: h0} = this.value;
            event.preventDefault();
            dd({
                event,
                move: function (ctx) {
                    _this.value.x = x0 + ctx.dx;
                    _this.value.y = y0 + ctx.dy;
                    _this.value.h = h0 - ctx.dy;
                    _this.value.w = w0 - ctx.dx;
                },
            });
        },
        mousedown_topright: function (event) {
            const _this = this;
            const {x: x0, y: y0, w: w0, h: h0} = this.value;
            event.preventDefault();
            dd({
                event,
                move: function (ctx) {
                    _this.value.y = y0 + ctx.dy;
                    _this.value.w = w0 + ctx.dx;
                    _this.value.h = h0 - ctx.dy;
                },
            });
        },
        mousedown_bottomleft: function (event) {
            const _this = this;
            const {x: x0, y: y0, w: w0, h: h0} = this.value;
            event.preventDefault();
            dd({
                event,
                move: function (ctx) {
                    _this.value.x = x0 + ctx.dx;
                    _this.value.w = w0 - ctx.dx;
                    _this.value.h = h0 + ctx.dy;
                },
            });
        },
        mousedown_bottomright: function (event) {
            const _this = this;
            const {x: x0, y: y0, w: w0, h: h0} = this.value;
            event.preventDefault();
            dd({
                event,
                move: function (ctx) {
                    _this.value.w = w0 + ctx.dx;
                    _this.value.h = h0 + ctx.dy;
                },
            });
        },
    }
});
