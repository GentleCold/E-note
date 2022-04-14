const show = document.getElementById('show');
const small = document.getElementById('small');
const border = document.getElementById('border');
const reset = document.getElementById('reset');
const buttons = document.getElementsByClassName('button');

let size = 100;
let isDrag = false, isDragged = false;
let disX, disY;
let oldX, oldY;
let minSize = 10; // %
let delta = 8;

window.electronAPI.show((event, image, i) => {
    const id = i;
    const img = new Image();
    img.src = image;
    img.onload = () => {
        window.electronAPI.realImage(img.naturalWidth, img.naturalHeight);

        const reSize = (flag) => {
            let newSize = size;
            flag ? newSize -= --delta : newSize += delta++;
            if (delta <= 5) delta = 5;
            if (newSize < minSize) newSize = minSize;
            if (newSize <= 100) {
                img.style.left = `${(show.offsetWidth - img.width) / 2}px`;
                img.style.top = `${(show.offsetHeight - img.height) / 2}px`;
                small.style.display = 'none';
            } else {
                small.style.display = 'block';
            }
            img.style.width = `${newSize}%`;
            img.style.height = `${newSize}%`;
            border.style.width = border.style.height = `${show.offsetHeight / img.offsetHeight * 100}%`;

            // important!
            let k = newSize / size;
            img.style.left = `${(k * img.offsetLeft - (k - 1) * show.offsetWidth / 2)}px`;
            img.style.top = `${(k * img.offsetTop - (k - 1) * show.offsetHeight / 2)}px`;

            if (newSize > 100) {
                if (img.offsetLeft > 0) img.style.left = '0';
                if (img.offsetTop > 0) img.style.top = '0';
                if (img.offsetLeft + img.width < show.offsetWidth) img.style.left = show.offsetWidth - img.width + 'px';
                if (img.offsetTop + img.height < show.offsetHeight) img.style.top = show.offsetHeight - img.height + 'px';
            }

            border.style.left = `${-img.offsetLeft / img.offsetWidth * 100}%`
            border.style.top = `${-img.offsetTop / img.offsetHeight * 100}%`

            if (newSize !== 100) {
                reset.style.display = 'block';
            }
            size = newSize;
        }
        buttons[0].onclick = () => { reSize(true); };
        buttons[1].onclick = () => { reSize(false); };

        show.onwheel = (e) => {
            if (e.wheelDelta < 0) reSize(true);
            else reSize(false);
        }

        reset.onclick = () => {
            size = 100;
            img.style.width = `${size}%`;
            img.style.height = `${size}%`;
            img.style.top = '0px';
            img.style.left = '0px';
            small.style.display = 'none';
            border.style.width = border.style.height = '100%';
            border.style.top = border.style.left = '0px';
            delta = 8;
            reset.style.display = 'none';
        }

        show.onmousedown = (e) => {
            isDrag = true;
            oldX = e.screenX;
            oldY = e.screenY;
            disX = e.clientX - img.offsetLeft;
            disY = e.clientY - img.offsetTop;
        }

        document.onmousemove = (e) => {
            if (!isDrag) return;
            isDragged = true;
            if (size <= 100) return;
            img.style.cursor = 'grab';
            let deltaX = e.clientX - disX;
            let deltaY = e.clientY - disY;

            if (deltaX >= 0 && img.offsetLeft <= 0) { deltaX = 0; }
            if (deltaY >= 0 && img.offsetTop <= 0) { deltaY = 0; }
            if (img.offsetLeft + img.width >= show.offsetWidth && deltaX + img.width <= show.offsetWidth) { deltaX = show.offsetWidth - img.width; }
            if (img.offsetTop + img.height >= show.offsetHeight && deltaY + img.height <= show.offsetHeight) { deltaY = show.offsetHeight - img.height; }

            img.style.left = deltaX + 'px';
            img.style.top = deltaY + 'px';
            border.style.left = `${-deltaX / img.width * 100}%`;
            border.style.top = `${-deltaY / img.height * 100}%`;
        };

        document.onmouseup = () => {
			isDrag = false;
			img.style.cursor = 'default';
            isDragged = false;
		}

        img.onmouseup = () => {
            if (!isDragged && size <= 100) {
                window.electronAPI.close(id);
            }
            isDragged = false;
        }
    }
    show.appendChild(img);
    const img2 = new Image();
    img2.src = image;
    small.appendChild(img2);
});

// prevent to open the menu
document.onkeydown = (e) => {
    if (e.altKey) {
        e.preventDefault();
    }
}