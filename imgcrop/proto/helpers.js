function make_croptype()
{
    return {
        x: 100,
        y: 100,
        w: 200,
        h: 200,
        zoom: 0.5,
        ox: -100,
        oy: -100
    };
}

function px(value)
{
    return value ? `${value}px` : '0';
}

async function image_from_url(src)
{
    const delays = [0, 0, 1000, 5000, 10000];

    let last_error;
    for (let i = 0, end = delays.length; i < end; ++i) {
        await Promise.delay(delays[i]);
        try {
            return await new Promise(function (resolve, reject) {
                const img = new Image();
                img.onload = function () { resolve(img); };
                img.onerror = function (event) {
                    const error = new Error(`image_from_url failed [${src}]`);
                    error.event = event;
                    reject(error);
                };
                img.src = src;
            });
        }
        catch (error) {
            last_error = error;
        }
    }
    throw last_error;
}

async function image_crop(img, x, y, w, h)
{
    const canvas = document.createElement('CANVAS');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
    return new Promise(function (resolve, reject) {
        try {
            canvas.toBlob(resolve);
        }
        catch (error) {
            reject(error);
        }
    });
}

// https://gist.github.com/philipstanislaus/c7de1f43b52531001412
const saveBlob = (function () {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    return function (blob, fileName) {
        var url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    };
}());
