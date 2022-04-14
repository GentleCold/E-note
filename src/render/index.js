const text = document.getElementById('editor');
const init = document.getElementById('init');
const filter = document.getElementById('filter');
const background = document.getElementsByTagName('body');
const searchBar = document.getElementById('search');
const toolBar = document.getElementById('toolbar');
const calculate = document.getElementById('calText');
const strong = document.getElementsByClassName('strong');
const buttons = document.getElementsByClassName('button');
let time = 0;
let ifSaved = true;
let ifOpened = false;
let index = 0;
let total = 0;
let data;
let imgCache;
let length = 0;
let caches = [];
let initNumber = 0;

setInterval(() => {
    const images = document.images;
    if (length !== images.length) {
        if (length > images.length) {
            let arr = [];
            for (let i = 0; i < images.length; i++) {
                const path = images[i].src;
                let j = path.length - 1;
                while (path[j] !== '/') j--;
                arr.push(parseInt(path.slice(j + 1)));
            }
            for(let i = 0; i < caches.length; i++) {
                if (arr.indexOf(caches[i]) === -1) {
                    window.electronAPI.deleteCache(window.electronAPI.getPath(caches[i] + '.png'));
                }
            }
            caches = arr;
        }
        length = images.length;
    }
}, 100);

setInterval(() => { if (time <= 50) time++; }, 1);

window.electronAPI.getCache((e, number) => {
    imgCache = number;
})

text.addEventListener('paste',function(e) {
    e.preventDefault();
    const cbd = e.clipboardData;
    const text = cbd.getData('text/plain');
    if (text) {
        // no alternative up to now
        document.execCommand('insertText', false, text);
    } else {
        const blob = cbd.items[0].getAsFile();
        const reader =  new FileReader();
        let src;
        reader.readAsDataURL(blob);
        reader.onload = (e) => {
            src = e.target.result;
            src = src.replace(/^data:image\/\w+;base64,/, "");
            const path = window.electronAPI.getPath(imgCache + '.png');
            window.electronAPI.saveText(path, src, 'base64');
            document.execCommand('insertImage', false, path);
            caches.push(imgCache);
            imgCache++;
            length++;
            window.electronAPI.sendCache(imgCache);
            // 等待重绘
            setTimeout(() => {
                const images = document.images;
                for (let i = 0; i < images.length; i++) {
                    images[i].onclick = () => {
                        if (time > 50) {
                            window.electronAPI.image(images[i].src);
                            time = 0;
                        }
                    }
                }
            }, 1);
        }
    }
})

window.electronAPI.handleMenu((event, type, path, flag) => {
    if (type === 'new') {
        document.title = 'E-note-untitled *';
        text.innerHTML = '';
        caches = [];
        length = 0;
        ifSaved = false;
        window.electronAPI.sendIfSaved(ifSaved);
    } else if (type === 'open') {
        document.title = `E-note-${path}`;
        try {
            const data = window.electronAPI.readText(path);
            const code = window.electronAPI.detect(data).encoding;
            // console.log(code);
            if (code === 'UTF-8' || code === 'ascii' || code === null) {
                text.innerHTML = window.electronAPI.decode(data, 'UTF8');
            } else if (code === 'Big5' || code === 'GB2312') {
                text.innerHTML = window.electronAPI.decode(data, 'GBK');
            } else {
                window.electronAPI.warning('format');
                document.title = `E-note`;
                return;
            }
        } catch (e) {
            document.title = `E-note`;
            return;
        }

        const images = document.images;
        length = document.images.length;
        caches = [];
        initNumber = 0;
        for (let i = 0; i < images.length; i++) {
            images[i].onclick = () => {
                if (time > 50) {
                    window.electronAPI.image(images[i].src);
                    time = 0;
                }
            };
            const path = images[i].src;
            let j = path.length - 1;
            while (path[j] !== '/') j--;
            caches.push(parseInt(path.slice(j + 1)));
            initNumber++;
        }

        ifSaved = true;
        window.electronAPI.sendIfSaved(ifSaved);
    } else if (type === 'save') {
        if (!flag) {
            document.title = `E-note-${path}`;
            window.electronAPI.saveText(path, text.innerHTML, 'utf8');
            ifSaved = true;
            window.electronAPI.sendIfSaved(ifSaved);
        } else {
            window.electronAPI.saveText(path, text.innerText, 'utf8');
        }
    } else if (type === 'home') {
        filter.style.display = 'none';
        ifSaved = true;
        ifOpened = false;
        document.title = 'E-note';
        text.style.display = 'none';
        init.style.display = 'flex';
        background[0].style.backdropFilter = 'none';
        return;
    }

    if (!ifOpened) {
        filter.style.display = 'block';
        text.style.display = 'block';
        init.style.display = 'none';
        background[0].style.backdropFilter = 'blur(5px)';
        text.focus();
        ifOpened = true;
    }
});

window.electronAPI.handleClear(() => {
    for (let i = initNumber; i < caches.length; i++) {
        window.electronAPI.deleteCache(window.electronAPI.getPath(caches[i] + '.png'));
    }
});

text.oninput = () => {
    if (ifSaved) {
        document.title += ' *';
        ifSaved = false;
        window.electronAPI.sendIfSaved(ifSaved);
    }
};

// prevent to open img viewer twice
let isDrag = false;
let isDragged = false;
document.onmousedown = () => isDrag = true;
document.onmousemove = () => {
    if (isDrag)
        isDragged = true;
}
document.onmouseup = () => {
    if (isDragged) {
        isDragged = false;
        const images = document.images;
        for (let i = 0; i < images.length; i++) {
            images[i].onclick = () => {
                if (time > 50) {
                    window.electronAPI.image(images[i].src);
                    time = 0;
                }
            }
        }
    }
    isDrag = false;
}

// search
const handleSearch = () => {
    const result = window.searchAPI.result(searchBar.value, data);
    if (result.total === 0) {
        calculate.innerText = `${index}/${total}`;
        search.style.width = document.getElementById('calculate').offsetLeft - 20 + 'px';
        text.innerHTML = data;
    } else {
        text.innerHTML = result.data;
        total = result.total;
        index = 1;
        calculate.innerText = `${index}/${total}`;
        strong[index - 1].style.backgroundColor = 'firebrick';
        strong[index - 1].scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
        });
        search.style.width = document.getElementById('calculate').offsetLeft - 20 + 'px';
    }
}

searchBar.oninput = () => {
    handleSearch();
}

window.electronAPI.search(() => {
    if (!ifOpened) {
        window.electronAPI.warning('openFile');
    }
    toolBar.style.display = 'flex';
    searchBar.focus();
    data = text.innerHTML;
    text.contentEditable = 'false';
    if (searchBar.value) {
        handleSearch();
    }
});

buttons[0].onclick = () => {
    if (total !== 0) {
        strong[index - 1].style.backgroundColor = 'goldenrod';
        index = (index + total - 2) % total + 1;
        calculate.innerText = `${index}/${total}`;
        searchBar.style.width = document.getElementById('calculate').offsetLeft - 20 + 'px';
        strong[index - 1].style.backgroundColor = 'firebrick';
        strong[index - 1].scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest"
        });
    }

}

buttons[1].onclick = () => {
    if (total !== 0) {
        strong[index - 1].style.backgroundColor = 'goldenrod';
        index = index % total + 1;
        calculate.innerText = `${index}/${total}`;
        strong[index - 1].style.backgroundColor = 'firebrick';
        searchBar.style.width = document.getElementById('calculate').offsetLeft - 20 + 'px';
        strong[index - 1].scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest"
        });
    }
}

buttons[2].onclick = () => {
    text.contentEditable = 'true';
    text.innerHTML = data;
    toolBar.style.display = 'none';
}

document.onkeydown = (e) => {
    if (ifOpened) {
        if (e.key === 'Tab') {
            // 获取光标的range对象 event.view 是一个window对象
            let range = window.getSelection().getRangeAt(0);
            // 光标的偏移位置
            let offset = range.startOffset;
            // 新建一个span元素
            let span = document.createElement('span');
            // 四个 表示四个空格
            span.innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;';
            // 创建一个新的range对象
            let newrange = document.createRange();
            // 设置新的range的位置，也是插入元素的位置
            newrange.setStart(range.startContainer, offset);
            newrange.setEnd(range.startContainer, offset);
            newrange.collapse(true);
            newrange.insertNode(span);
            // 去掉旧的range对象，用新的range对象替换
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
            // 将光标的位置向后移动一个偏移量，放到加入的四个空格后面
            range.setStart(span, 1);
            range.setEnd(span, 1);
        }
    }
}