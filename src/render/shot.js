window.electronAPI.handleShot((event, img) => {
    // 获取图像并显示
    let src = window.electronAPI.buffer(img);
    const image = new Image();
    image.src = 'data:image/png;base64,' + src;
    // 创建绘制canvas
    const drawCanvas = document.getElementById('canvas');
    const drawCtx = drawCanvas.getContext('2d');
    // 创建虚拟canvas
    const virtualCanvas = document.createElement('canvas');
    const virtualCtx = virtualCanvas.getContext('2d');
    // 创建缩略canvas
    const thumb = document.getElementById('thumb');
    const thumbCtx = thumb.getContext('2d');
    // 创建canvas保存结果
    const canvas = document.createElement('canvas');
    // 工具条
    const bar = document.getElementById('toolbar');
    const bar2 = document.getElementById('toolbar2');
    const size = document.getElementById('size');
    // 显示rgb色值
    const color = document.getElementById('color');
    let width, height, k1, k2, k3, k4;
    // 存储选取
    let area = {};
    let win;
    image.onload = () => {
        // 设置画布大小
        width = document.body.clientWidth;
        height = document.body.clientHeight;
        // 获取比例
        k1 = image.naturalWidth / width;
        k2 = image.naturalHeight / height;
        // 鼠标修正
        k3 = width / (width - 1);
        k4 = height / (height - 1);

        drawCanvas.width = width;
        drawCanvas.height = height;
        virtualCanvas.width = image.naturalWidth;
        virtualCanvas.height = image.naturalHeight;

        // 设置样式
        drawCtx.fillStyle = 'rgba(0,0,0,0.5)';
        drawCtx.strokeStyle = 'rgba(255,255,255,0.7)';
        drawCtx.lineWidth = 1;
        // 绘制遮罩
        drawCtx.fillRect(0, 0, width, height);
        // 绘制虚拟图像
        virtualCtx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);

        let choose = false;
        let begin = false;
        let flag = false;
        let resize = false;
        let ifRgb = true;
        let x, y, newX, newY, rgb;
        document.onmousedown = (e) => {
            if (e.button === 0) {
                if (!choose) {
                    begin = {
                        x: e.clientX * k3,
                        y: e.clientY * k4,
                    }
                }
                if (resize) {
                    bar.style.display = 'none';
                    begin = {};
                    if (resize === 2 || resize === 7 || resize === 4) {
                        begin.x = area.x;
                        begin.y = area.y;
                    } else if (resize === 1 || resize === 8) {
                        begin.x = area.x + area.w;
                        begin.y = area.y;
                    } else if (resize === 6 || resize === 3) {
                        begin.x = area.x;
                        begin.y = area.y + area.h;
                    } else if (resize === 5) {
                        begin.x = area.x + area.w;
                        begin.y = area.y + area.h;
                    } else if (resize === 9) {
                        bar.style.display = 'flex';
                        begin.x = area.x;
                        begin.y = area.y;
                        x = e.clientX * k3;
                        y = e.clientY * k4;
                    }
                }
            }
        }
        document.onmousemove = (e) => {
            if (!begin && !choose) {
                win = window.electronAPI.getWin();
                // console.log(win);
                drawCtx.clearRect(0, 0, width, height);
                drawCtx.fillRect(0, 0, width, height);
                if (win.left < 0) win.left = 0;
                if (win.top < 0) win.top = 0;
                if (win.right > width * k1) win.right = width * k1;
                if (win.bottom > height * k2) win.bottom = height * k2;
                drawCtx.lineWidth = 3;
                drawCtx.clearRect(win.left / k1, win.top / k2, (win.right - win.left) / k1, (win.bottom -  win.top) / k2);
                drawCtx.strokeRect(win.left / k1, win.top / k2, (win.right - win.left) / k1, (win.bottom -  win.top) / k2);
                changeBar2(e.clientX, e.clientY);
                // 放大图片
                handleThumb(e.clientX, e.clientY);

                // size
                size.style.display = 'block';
                let x = win.left / k1;
                let y = win.top / k2;
                size.innerText = `${Math.round(Math.abs(win.right - win.left))} × ${Math.round(Math.abs(win.bottom -  win.top))}`;
                let left = x - 2;
                let top = y - 31;
                if (left + 100 > width) left = width - 100;
                if (top < 0) top = 0;
                size.style.left = left + 'px';
                size.style.top = top + 'px';
            }
            if (choose && !begin) {
                resize = 0;
                // 判断边界区域
                if (((e.clientX * k3 >= area.x - 2 && e.clientX * k3 <= area.x + 2) && (e.clientY * k4 >= area.y + 2 && e.clientY * k4 <= area.y + area.h - 2))) {
                    document.body.style.cursor = 'ew-resize'; resize = 1; // 左横向
                } else if (((e.clientX * k3 >= area.x + area.w - 2 && e.clientX * k3 <= area.x + area.w + 2) && (e.clientY * k4 >= area.y + 2 && e.clientY * k4 <= area.y + area.h - 2))) {
                    document.body.style.cursor = 'ew-resize'; resize = 2; // 右横向
                } else if (((e.clientX * k3 >= area.x + 2 && e.clientX * k3 <= area.x + area.w - 2) && (e.clientY * k4 >= area.y - 2 && e.clientY * k4 <= area.y + 2))) {
                    document.body.style.cursor = 'ns-resize'; resize = 3; // 上纵向
                } else if (((e.clientX * k3 >= area.x + 2 && e.clientX * k3 <= area.x + area.w - 2) && (e.clientY * k4 >= area.y + area.h - 2 && e.clientY * k4 <= area.y + area.h + 2))) {
                    document.body.style.cursor = 'ns-resize'; resize = 4; // 下纵向
                } else if ((e.clientX * k3 >= area.x - 2 && e.clientX * k3 <= area.x + 2 && e.clientY * k4 >= area.y - 2 && e.clientY * k4 <= area.y + 2)) {
                    document.body.style.cursor = 'nwse-resize'; resize = 5; // 左上
                } else if ((e.clientX * k3 >= area.x + area.w - 2 && e.clientX * k3 <= area.x + area.w + 2 && e.clientY * k4 >= area.y - 2 && e.clientY * k4 <= area.y + 2)) {
                    document.body.style.cursor = 'nesw-resize'; resize = 6; // 右上
                } else if ((e.clientX * k3 >= area.x + area.w - 2 && e.clientX * k3 <= area.x + area.w + 2 && e.clientY * k4 >= area.y + area.h - 2 && e.clientY * k4 <= area.y + area.h + 2)) {
                    document.body.style.cursor = 'nwse-resize'; resize = 7; // 右下
                } else if ((e.clientX * k3 >= area.x - 2 && e.clientX * k3 <= area.x + 2 && e.clientY * k4 >= area.y + area.h - 2 && e.clientY * k4 <= area.y + area.h + 2)) {
                    document.body.style.cursor = 'nesw-resize'; resize = 8; // 左下
                } else if (e.clientX * k3 >= area.x + 2 && e.clientX * k3 <= area.x + area.w - 2 && e.clientY * k4 >= area.y + 2 && e.clientY * k4 <= area.y + area.h - 2) {
                    document.body.style.cursor = 'move'; resize = 9; // 区域内
                }
                if (!resize) document.body.style.cursor = 'default';
            }
            if (e.button === 0) {
                if (begin) {
                    choose = false;
                    flag = true;
                    let flag2 = true;
                    drawCtx.lineWidth = 1;
                    if (resize === 1 || resize === 2) {
                        let w = e.clientX * k3 - begin.x;
                        let x = begin.x;
                        let y = begin.y;
                        let h = area.h;
                        if (w === 0) w = 1 / k1;
                        if (h === 0) h = 1 / k2;
                        draw(x, y, w, h);
                    } else if (resize === 3 || resize === 4) {
                        let w = area.w;
                        let x = begin.x;
                        let y = begin.y;
                        let h = e.clientY * k4 - begin.y;
                        if (w === 0) w = 1 / k1;
                        if (h === 0) h = 1 / k2;
                        draw(x, y, w, h);
                    } else if (resize === 9) {
                        drawCtx.clearRect(0, 0, width, height);
                        drawCtx.fillRect(0, 0, width, height);
                        newX = begin.x + e.clientX * k3 - x;
                        newY = begin.y + e.clientY * k4 - y;
                        if (newX < 0) newX = 0;
                        if (newY < 0) newY = 0;
                        if (newX + area.w > width) newX = width - area.w;
                        if (newY + area.h > height) newY = height - area.h;
                        drawCtx.clearRect(newX, newY, area.w, area.h);
                        drawCtx.strokeRect(newX, newY, area.w, area.h);
                        let right = width - newX - area.w - 1;
                        let top = newY + area.h + 5;
                        if (right > width - 100) right = width - 100;
                        if (top > height - 25) top = height - 25;

                        bar.style.right = right + 'px';
                        bar.style.top = top + 'px';
                        let newLeft = newX - 1;
                        let newTop = newY - 30;
                        if (newLeft + 100 > width) newLeft = width - 100;
                        if (newTop < 0) newTop = 0;
                        size.style.left = newLeft + 'px';
                        size.style.top = newTop + 'px';
                        flag2 = false;
                    } else {
                        let w = e.clientX * k3 - begin.x;
                        let h = e.clientY * k4 - begin.y;
                        if (w === 0) w = 1 / k1;
                        if (h === 0) h = 1 / k2;
                        draw(begin.x, begin.y, w, h);
                    }

                    changeBar2(e.clientX, e.clientY);

                    if (flag2) {
                        size.style.display = 'block';
                        let x = begin.x;
                        let y = begin.y;
                        if (e.clientX * k3 - begin.x < 0) { x = e.clientX * k3; }
                        if (e.clientY * k4 - begin.y < 0) { y = e.clientY * k4; }
                        let left = x - 1;
                        let top = y - 30;
                        if (left + 100 > width) left = width - 100;
                        if (top < 0) top = 0;
                        size.style.left = left + 'px';
                        size.style.top = top + 'px';
                    }

                    handleThumb(e.clientX, e.clientY);
                }
            }
        }
        document.onmouseup = (e) => {
            if (e.button === 0) {
                if (!choose && !flag) {
                    area.x = win.left / k1;
                    area.y = win.top / k2;
                    area.w = (win.right - win.left) / k1;
                    area.h = (win.bottom - win.top) / k2;
                    if (area.w === 0) area.w = 1;
                    if (area.h === 0) area.h = 1;
                    drawCtx.lineWidth = 1;
                    drawCtx.clearRect(0, 0, width, height);
                    drawCtx.fillRect(0, 0, width, height);
                    drawCtx.clearRect(area.x, area.y, area.w, area.h);
                    drawCtx.strokeRect(area.x, area.y, area.w, area.h);
                    const data = virtualCtx.getImageData(area.x * k1, area.y * k2, area.w * k1, area.h * k2);
                    // 新建canvas获取图像
                    canvas.height = area.h * k2;
                    canvas.width = area.w * k1;
                    bar2.style.display = 'none';
                    bar.style.display = 'flex';
                    let right = width - area.x - area.w - 1;
                    let top = area.y + area.h + 5;
                    canvas.getContext('2d').putImageData(data, 0, 0);
                    if (top > height - 25) top = height - 25;
                    if (right > width - 100) right = width - 100;
                    bar.style.top = top + 'px';
                    bar.style.right = right + 'px';
                    let x = win.left / k1;
                    let y = win.top / k2;
                    let left = x - 1;
                    top = y - 30;
                    if (left + 100 > width) left = width - 100;
                    if (top < 0) top = 0;
                    size.style.left = left + 'px';
                    size.style.top = top + 'px';
                    flag = false;
                    choose = true;
                }
                if (begin && flag) {
                    // x, y始终定位在左上角
                    if (resize === 1 || resize === 2) {
                        area.x = begin.x;
                        area.y = begin.y;
                        area.w = e.clientX * k3 - begin.x;
                        if (area.w < 0) {
                            area.x += area.w;
                            area.w = -area.w;
                        }
                    } else if (resize === 3 || resize === 4) {
                        area.x = begin.x;
                        area.y = begin.y;
                        area.h = e.clientY * k4 - begin.y;
                        if (area.h < 0) {
                            area.y += area.h;
                            area.h = -area.h;
                        }
                    } else if (resize === 9) {
                        area.x = newX;
                        area.y = newY;
                    } else {
                        area.x = begin.x;
                        area.y = begin.y;
                        area.w = e.clientX * k3 - begin.x;
                        area.h = e.clientY * k4 - begin.y;
                        if (area.w < 0) {
                            area.x += area.w;
                            area.w = -area.w;
                        }
                        if (area.h < 0) {
                            area.y += area.h;
                            area.h = -area.h;
                        }
                    }
                    if (area.w === 0) area.w = 1 / k1;
                    if (area.h === 0) area.h = 1 / k2;
                    saveCanvas();

                    bar2.style.display = 'none';
                    bar.style.display = 'flex';
                    let right = width - area.x - area.w - 1;
                    let top = area.y + area.h + 5;
                    if (right > width - 100) right = width - 100;
                    if (top > height - 25) top = height - 25;

                    bar.style.top = top + 'px';
                    bar.style.right = right + 'px';
                    flag = false;
                    choose = true;
                }
                begin = false;
            }
        }
        document.getElementById('yes').onclick = () => {
            canvas.toBlob((blob) => {
                navigator.clipboard.write([
                    new ClipboardItem({
                        [blob.type]: blob
                    })
                ]).then(() => { window.electronAPI.close(); });
            }, 'image/png', 1);
        }
        document.getElementById('no').onclick = () => {
            window.electronAPI.close();
        }
        document.getElementById('pin').onclick = () => {
            saveCanvas();
            const win = document.getElementById('win');
            image.src = canvas.toDataURL('image/png', 1);
            image.onload = () => {};
            document.getElementById('pin').remove();
            document.body.style.cssText = '-webkit-app-region: drag;background-color: transparent;';
            win.style.cssText = `position: absolute;left: 10px;top: 10px;width: ${area.w}px;height: ${area.h}px;text-align: center;background-color: transparent;display: block;border-radius: 10px;box-shadow:2px 0px 5px rgb(43,43,43,0.5), -2px 0 5px rgb(43,43,43,0.5), 0px 2px 5px rgb(43,43,43,0.5);`;
            image.style.cssText = `position: absolute;left: 10px;top: 10px;width: ${area.w}px;height: ${area.h}px;border-radius: 10px;z-index: 0;`
            bar.style.cssText = `-webkit-app-region: no-drag;width: 75px;display: flex;position:absolute;top: ${area.h + 15}px;left: ${area.w - 65}px;transition: opacity .5s;opacity:0;z-index: 1;position: absolute;align-items: center;justify-content: center;flex-wrap: nowrap;border-radius: 5px;`
            bar.onmouseover = () => bar.style.opacity = '1';
            bar.onmouseout = () => bar.style.opacity = '0';
            bar2.style.display = size.style.display = drawCanvas.style.display = 'none';
            document.onmousedown = document.onmousemove = document.onmouseup = () => {};
            window.electronAPI.pin(Math.round(area.w + 20), Math.round(area.h + 40), Math.round(area.x), Math.round(area.y));
        }
        document.onkeydown = (e) => {
            if (rgb) {
                if (e.code === 'KeyC') {
                    if (ifRgb) {
                        navigator.clipboard.writeText(`${rgb[0]} ${rgb[1]} ${rgb[2]}`).then();
                    } else {
                        navigator.clipboard.writeText(to16(rgb)).then();
                    }
                } else if (e.ctrlKey) {
                    ifRgb = false;
                    color.innerHTML = `${to16(rgb)}<br>Press C to get color`;
                }
            }
        }
        document.onkeyup = () => {
            ifRgb = true;
            color.innerHTML = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})<br>Press C to get color`;
        }

        const changeBar2 = (x, y) => {
            bar2.style.display = 'flex';
            let left = x * k3 + 15;
            let top = y * k4 + 20;
            if (left + 175 > width) left = width - 175;
            if (top + 175 > height) top = height - 175;
            bar2.style.left = left + 'px';
            bar2.style.top = top + 'px';
        }

        const handleThumb = (x, y) => {
            thumbCtx.clearRect(0, 0, 150, 100);
            thumbCtx.drawImage(image, x * k3 * k1 - 75 / 4, y * k4 * k2 - 50 / 4, 150, 100, 0, 0, 600, 400);
            // 绘制定位线条
            thumbCtx.lineWidth = 1;
            thumbCtx.strokeStyle = 'tomato';
            thumbCtx.moveTo(75, 0);
            thumbCtx.lineTo(75,100);
            thumbCtx.stroke();
            thumbCtx.moveTo(0, 50);
            thumbCtx.lineTo(150,50);
            thumbCtx.stroke();
            // 获取并显示rgb
            rgb = virtualCtx.getImageData(x * k3 * k1, y * k4 * k2, 1, 1).data;
            if (ifRgb) {
                color.innerHTML = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})<br>Press C to get color`;
            } else {
                color.innerHTML = `${to16(rgb)}<br>Press C to get color`;
            }
            color.style.color = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
        }

        const saveCanvas = () => {
            const data = virtualCtx.getImageData(area.x * k1, area.y * k2, area.w * k1, area.h * k2);
            // 新建canvas获取图像
            canvas.width = area.w * k1;
            canvas.height = area.h * k2;
            canvas.getContext('2d').putImageData(data, 0, 0);
        }

        const draw = (x, y, w, h) => {
            drawCtx.clearRect(0, 0, width, height);
            drawCtx.fillRect(0, 0, width, height);
            size.innerText = `${Math.round(Math.abs((w) * k1))} × ${Math.round(Math.abs((h) * k2))}`;
            drawCtx.clearRect(x, y, w, h);
            drawCtx.strokeRect(x, y, w, h);
        }
    }
    document.body.appendChild(image);
})

// 换算rgb
const to16 = (rgb) => {
    const str = 'ABCDEF';
    let ans = '#';
    for (let i = 0; i < 3; i++) {
        const n = rgb[i] % 16;
        const m = Math.floor(rgb[i] / 16);
        ans += (m >= 10) ? str[m - 10]: m.toString();
        ans += (n >= 10) ? str[n - 10]: n.toString();
    }
    return ans;
}