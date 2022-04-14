/**
 * A class do the searching for contenteditable div tag.
 * @class
 */
class Search {
    #result = {
        data: '',
        total: 0,
    };
    #slice = '';
    #index = 0;

    #handleTarget = target => {
        target = target.replace(/&/g, '&amp;');
        target = target.replace(/</g, '&lt;');
        target = target.replace(/>/g, '&gt;');
        target = target.replace(/ /g, '&nbsp;');
        return target;
    }

    #ifSpecial = target => {
        let flag = 0;
        if (target.startsWith('amp;') || target.startsWith('mp;') || 'amp;'.indexOf(target) >= 0) flag = 1;
        else if (target.startsWith('nbsp;') || target.startsWith('bsp;') || target.startsWith('sp;') || 'nbsp;'.indexOf(target) >= 0) flag = 2;
        else if (target.startsWith('lt;') || 'lt;'.indexOf(target) >= 0) flag = 3;
        else if (target.startsWith('gt;') || 'gt;'.indexOf(target) >= 0) flag = 4;
        if (target.startsWith('p;') || target === 'p') flag = 5;
        if (target.startsWith('t;') || target === 't') flag = 6;
        if (target.startsWith(';')) flag = 7;
        return flag;
    }

    #ifMatchSpecial = special => {
        const delta = this.#index - this.#slice.search(special);
        return this.#slice.search(special) >= 0 && delta <= special.length - 1 && delta >= 0;
    }

    /**
     * A function that search target and insert a div tag for it
     * @param {string} target -the string you want to match
     * @param {string} data -the string from whitch you want to search
     * @param {boolean} caseSensitivity -if case-sensitivity, default is true
     * @param {string} className -the class of div tag
     */
    result(target, data, caseSensitivity = true, className = 'strong') {
        let newData = '';

        if (!target) {
            this.#result.data = data;
            this.#result.total = 0;
            return this.#result;
        }

        target = this.#handleTarget(target);

        let total = 0;
        let init = 0;
        let i = 0;

        // 循环匹配所有匹配到的结果
        while(i < data.length) {
            let left, right;

            // 跳过标签
            while (data[i] === '<') {
                while (data[i] !== '>') {
                    i++;
                }
                i++;
                if (i >= data.length) {
                    newData += data.slice(init);
                    break;
                }
            }

            // 检验出口
            if (i >= data.length) {
                break;
            }

            // 获取标签间字符串slice
            left = i;
            while (data[i] !== '<') {
                i++;
                if (i >= data.length) {
                    break;
                }
            }
            right = i;

            if (right - left < target.length) {
                newData += data.slice(init, right);
                init = right;
                continue;
            }

            let add = '';
            let slice = data.slice(left, right).replace(/ /g, '&nbsp;');
            let index;
            let flag = 0;

            // 是否区分大小写
            if (caseSensitivity) {
                slice = slice.toLowerCase();
                target = target.toLowerCase();
            }

            // 是否为特殊字符
            flag = this.#ifSpecial(target);

            // 遍历搜寻slice中匹配到的所有结果
            while ((index = slice.indexOf(target)) >= 0) {
                // 传递给私有属性以节省传参
                this.#slice = slice;
                this.#index = index;

                if (flag) {
                    let ifJump = false;
                    // 若匹配到的是特殊字符，则跳过
                    if (flag === 1) {
                        ifJump = this.#ifMatchSpecial('&amp;');
                    } else if (flag === 2) {
                        ifJump = this.#ifMatchSpecial('&nbsp;');
                    } else if (flag === 3) {
                        ifJump = this.#ifMatchSpecial('&lt;');
                    } else if (flag === 4) {
                        ifJump = this.#ifMatchSpecial('&gt;');
                    } else if (flag === 5) {
                        ifJump = this.#ifMatchSpecial('&amp;') || this.#ifMatchSpecial('&nbsp;');
                    } else if (flag === 6) {
                        ifJump = this.#ifMatchSpecial('&gt;') || this.#ifMatchSpecial('&lt;');
                    } else if (flag === 7) {
                        ifJump = this.#ifMatchSpecial('&amp;') || this.#ifMatchSpecial('&nbsp;')
                        || this.#ifMatchSpecial('&gt;') || this.#ifMatchSpecial('&lt;');
                    }

                    if (ifJump) {
                        add += slice.slice(0, index + target.length);
                        slice = slice.slice(index + target.length);
                        continue;
                    }
                }

                // 对找到的添加标签
                total++;
                add += slice.slice(0, index) + `<div class="${className}">` + slice.slice(index, index + target.length) + '</div>';
                slice = slice.slice(index + target.length);
            }

            add += slice;
            newData += data.slice(init, left) + add;
            init = right;
        }

        this.#result.data = newData;
        this.#result.total = total;
        return this.#result;
    }
}

module.exports = Search;