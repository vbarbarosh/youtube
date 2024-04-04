function autoscroll(elem)
{
    let scroll_strength_x = 0;
    let scroll_strength_y = 0;
    const timer = setInterval(update, 10);
    const listeners = {
        mousemove: function (event) {
            const r = elem.getBoundingClientRect();
            const MARGIN = Math.min((r.right - r.left)*0.3, (r.bottom - r.top)*0.3);
            const x = event.clientX;
            const y = event.clientY;
            const top1 = r.top;
            const top2 = r.top + MARGIN;
            const bottom1 = r.bottom - MARGIN;
            const bottom2 = r.bottom;
            const left1 = r.left;
            const left2 = r.left + MARGIN;
            const right1 = r.right - MARGIN;
            const right2 = r.right;
            scroll_strength_x = 0;
            scroll_strength_y = 0;
            if (x <= left2) {
                scroll_strength_x = strength(x, left1, left2) - 1;
            }
            if (x >= right1) {
                scroll_strength_x = strength(x, right1, right2);
            }
            if (y <= top2) {
                scroll_strength_y = strength(y, top1, top2) - 1;
            }
            if (y >= bottom1) {
                scroll_strength_y = strength(y, bottom1, bottom2);
            }
        },
    };
    jQuery(document).on(listeners);
    return {end};
    function end() {
        clearInterval(timer);
        jQuery(document).off(listeners);
    }
    function update() {
        elem.scrollTop += scroll_strength_y*15;
        elem.scrollLeft += scroll_strength_x*25;
    }

    /**
     * Map `x` from `[a..b]` to `[0..1]`.
     */
    function strength(x, a, b)
    {
        return (Math.min(b, Math.max(a, x)) - a)/(b - a);
    }
}
