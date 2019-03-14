/*! Tdrag 0.0.1 */
/**
 * Created by Tezml on 2016/5/26
 * You can modify my source code, if you have a good idea or a problem can be encountered by e-mail: tezml@tezml.com to find me.
 * 如果你想在项目中使用该插件，请不要删除该注释。
 */
// 插件制作

// 依赖构造函数
const Dragfn = function(ele, opt) {
    this.$element = ele;
    this.options = opt;
};
// 构造函数方法
Dragfn.prototype = {
    init(el) {
        this.ele = this.$element;
        this.handle = $(el); // 手柄
        this.options = this.options;
        this.disable = this.options.disable;
        this._start = false;
        this._move = false;
        this._end = false;
        this.disX = 0;
        this.disY = 0;
        this.zIndex = 1000;
        this.moving = false;
        this.moves = '';

        // 父级
        this.scope = $.type(this.options.scope) === 'string' ? this.options.scope : null;

        // 手柄
        if (this.options.handle !== null) this.handle = $(el).find(this.options.handle);

        // 三个事件
        this.handle.on('mousedown', event => {
            this.start(event, el);
            el.setCapture && el.setCapture();
            return false;
        });
        if (this.options.dragChange) {
            $(el).on('mousemove', event => this.move(event, el));
            $(el).on('mouseup', event => this.end(event, el));
        } else {
            $(document).on('mousemove', event => this.move(event, el));
            $(document).on('mouseup', event => this.end(event, el));
        }
    },

    start(event, el) {
        this.moved = el;
        if (this.disable === true) return false;
        // let mousedown = [offsetX, offsetY, pageX, pageY, screenX, screenY, clientX, clientY];
        // const { offsetLeft, offsetTop } = el;
        // const { offsetX, offsetY, pageX, pageY, screenX, screenY, clientX, clientY, movementX, movementY } = event;
        this._start = true;
        const { left, top } = $(el).offset();
        this.disX = event.clientX - el.offsetLeft;
        this.disY = event.clientY - el.offsetTop;
        this._disX = event.clientX - left;
        this._disY = event.clientY - top;
        this._OldCSS = { position: $(el).css('position'), margin: $(el).css('margin') };
        this._OldPos = {
            left: left - parseInt($(el).css('left'), 10),
            top: top - parseInt($(el).css('top'), 10)
        };
        $(el)
            .css('position', 'fixed')
            .css('left', left + 'px')
            .css('top', top + 'px')
            .css('margin', '0');

        $(el).css('zIndex', this.zIndex++);
        this.move(event, el, true);
        $.isFunction(this.options.dragStart) && this.options.dragStart(event, el, { left, top });
    },
    move(event, el, ncall) {
        if (this._start !== true) return false;
        if (el !== this.moved) return false;
        this._move = true;
        // let l = event.clientX - this.disX;
        // let t = event.clientY - this.disY;
        let l = event.clientX - this._disX;
        let t = event.clientY - this._disY;
        // 有父级限制
        if (this.scope !== null) {
            const rule = this.collTestBox(el, this.scope);
            if (l > rule.lmax) l = rule.lmax;
            else if (l < rule.lmin) l = rule.lmin;
            if (t > rule.tmax) t = rule.tmax;
            else if (t < rule.tmin) t = rule.tmin;
        }

        if (this.options.axis === 'all') {
            el.style.left = this.grid(el, l, t).left + 'px';
            el.style.top = this.grid(el, l, t).top + 'px';
        } else if (this.options.axis === 'y') el.style.top = this.grid(el, l, t).top + 'px';
        else if (this.options.axis === 'x') el.style.left = this.grid(el, l, t).left + 'px';

        // if (this.options.changeWhen === 'move') {
        //     if (this.options.changeMode === 'sort') this.sortDrag(el);
        //     else if (this.options.changeMode === 'point') this.pointmoveDrag(el);
        // } else this.moveAddClass(el);

        if (this.options.pos === true) this.moveAddClass(el);
        !ncall && $.isFunction(this.options.dragMove) && this.options.dragMove(event, el, { left: l, top: t });
    },
    end(event, el) {
        if (this._start !== true) return false;
        let PositionLeft = parseInt(el.style.left, 10);
        let PositionTop = parseInt(el.style.top, 10);
        if (this._OldCSS.position !== 'static') {
            $(el).css(this._OldCSS);
            PositionLeft -= this._OldPos.left;
            PositionTop -= this._OldPos.top;
        }

        el.style.left = PositionLeft + 'px';
        el.style.top = PositionTop + 'px';

        if (this.options.changeMode === 'sort' && this.options.pos === true) this.sortDrag(el);
        else if (this.options.changeMode === 'point' && this.options.pos === true) this.pointDrag(el);

        if (this.options.pos === true) this.animation(el, this.aPos[$(el).attr('index')]);

        if (this.options.handle !== null) {
            $(el)
                .find(this.options.handle)
                .unbind('onmousemove');
            $(el)
                .find(this.options.handle)
                .unbind('onmouseup');
        } else {
            $(el).unbind('onmousemove');
            $(el).unbind('onmouseup');
        }
        el.releaseCapture && el.releaseCapture();
        this._start = false;

        $.isFunction(this.options.dragEnd) && this.options.dragEnd(event, el, { left: PositionLeft, top: PositionTop });
    },

    // 算父级的宽高
    collTestBox(el, obj2) {
        const { top, left } = $(this.scope).offset();
        const lmin = left; // 取的l最小值
        const tmin = top; // 取的t最小值
        // const lmin = 0; // 取的l最小值
        // const tmin = 0; // 取的t最小值
        const lmax = $(obj2).innerWidth() + left - $(el).outerWidth(); // 取的l最大值
        const tmax = $(obj2).innerHeight() + top - $(el).outerHeight(); // 取的t最大值
        return { lmin, tmin, lmax, tmax };
    },
    // 算父级宽高时候干掉margin
    grid(el, l, t) {
        const grid = { left: l, top: t };
        if ($.isArray(this.options.grid) && this.options.grid.length === 2) {
            const gx = this.options.grid[0];
            const gy = this.options.grid[1];
            grid.left = Math.floor((l + gx / 2) / gx) * gx;
            grid.top = Math.floor((t + gy / 2) / gy) * gy;
            return grid;
        }
        if (this.options.grid === null) return grid;
        return false;
    },
    // 移动时候加class
    moveAddClass(el) {
        const oNear = this.findNearest(el);
        $(this.$element).removeClass(this.options.moveClass);
        if (oNear && $(oNear).hasClass(this.options.moveClass) === false) $(oNear).addClass(this.options.moveClass);
    },
    findNearest(el) {
        let iMin = new Date().getTime();
        let iMinIndex = -1;
        const ele = this.ele;
        for (let i = 0; i < ele.length; i++) {
            if (el === ele[i]) continue;
            if (this.collTest(el, ele[i])) {
                const dis = this.getDis(el, ele[i]);
                if (dis < iMin) {
                    iMin = dis;
                    iMinIndex = i;
                }
            }
        }
        if (iMinIndex === -1) return null;
        return ele[iMinIndex];
    },
    collTest(el, obj2) {
        const l1 = el.offsetLeft;
        const r1 = el.offsetLeft + el.offsetWidth;
        const t1 = el.offsetTop;
        const b1 = el.offsetTop + el.offsetHeight;

        const l2 = obj2.offsetLeft;
        const r2 = obj2.offsetLeft + obj2.offsetWidth;
        const t2 = obj2.offsetTop;
        const b2 = obj2.offsetTop + obj2.offsetHeight;

        if (r1 < l2 || r2 < l1 || t2 > b1 || b2 < t1) return false;

        return true;
    },
    getDis(el, obj2) {
        const l1 = el.offsetLeft + el.offsetWidth / 2;
        const l2 = obj2.offsetLeft + obj2.offsetWidth / 2;
        const t1 = el.offsetTop + el.offsetHeight / 2;
        const t2 = obj2.offsetTop + obj2.offsetHeight / 2;
        const a = l2 - l1;
        const b = t1 - t2;
        return Math.sqrt(a * a + b * b);
    },

    // 排序的方式换位
    sortDrag(el) {
        const arr_li = this.sort(); // 先拍序
        const oNear = this.findNearest(el); // 换位置
        if (oNear) {
            if (Number($(oNear).attr('index')) > Number($(el).attr('index'))) {
                // 前换后
                const obj_tmp = Number($(el).attr('index'));
                $(el).attr('index', Number($(oNear).attr('index')) + 1);
                for (let i = obj_tmp; i < Number($(oNear).attr('index')) + 1; i++) {
                    this.animation(arr_li[i], this.aPos[i - 1]);
                    this.animation(el, this.aPos[$(oNear).attr('index')]);
                    $(arr_li[i]).removeClass(this.options.moveClass);
                    $(arr_li[i]).attr('index', Number($(arr_li[i]).attr('index')) - 1);
                }
            } else if (Number($(el).attr('index')) > Number($(oNear).attr('index'))) {
                // 后换前
                const obj_tmp = Number($(el).attr('index'));
                $(el).attr('index', $(oNear).attr('index'));
                for (let i = Number($(oNear).attr('index')); i < obj_tmp; i++) {
                    this.animation(arr_li[i], this.aPos[i + 1]);
                    this.animation(el, this.aPos[Number($(el).attr('index'))]);
                    $(arr_li[i]).removeClass(this.options.moveClass);
                    $(arr_li[i]).attr('index', Number($(arr_li[i]).attr('index')) + 1);
                }
            }
        } else this.animation(el, this.aPos[$(el).attr('index')]);
    },
    // 给li排序
    sort() {
        const arr_li = [];
        for (let s = 0; s < this.$element.length; s++) arr_li.push(this.$element[s]);
        for (let i = 0; i < arr_li.length; i++) {
            for (let j = i + 1; j < arr_li.length; j++) {
                if (Number($(arr_li[i]).attr('index')) > Number($(arr_li[j]).attr('index'))) {
                    const temp = arr_li[i];
                    arr_li[i] = arr_li[j];
                    arr_li[j] = temp;
                }
            }
        }
        return arr_li;
    },
    // 点对点的方式换位
    pointDrag(el) {
        const oNear = this.findNearest(el); // 先拍序
        if (oNear) {
            this.animation(el, this.aPos[$(oNear).attr('index')]);
            this.animation(oNear, this.aPos[$(el).attr('index')]);
            const tmp = $(el).attr('index');
            $(el).attr('index', $(oNear).attr('index'));
            $(oNear).attr('index', tmp);
            $(oNear).removeClass(this.options.moveClass);
        } else if (this.options.changeWhen === 'end') this.animation(el, this.aPos[$(el).attr('index')]);
    },

    // 运动函数(后期再加参数)
    animation(el, opt) {
        // 考虑默认值
        const options = this.options.animation_options;
        // options.duration = this.options.animation_options.duration || 800;
        // options.easing = options.easing.duration.easing || 'ease-out';
        const count = Math.round(options.duration / 30);
        const start = {};
        const dis = {};
        for (const name in opt) {
            start[name] = parseFloat(this.getStyle(el, name));
            if (isNaN(start[name])) {
                if (name === 'left' || name === 'marginLeft') start[name] = el.offsetLeft;
                else if (name === 'top') start[name] = el.offsetTop;
                else if (name === 'width') start[name] = el.offsetWidth;
                else if (name === 'height') start[name] = el.offsetHeight;
                else if (name === 'borderWidth') start[name] = 0;
            }
            dis[name] = opt[name] - start[name];
        }

        let n = 0;

        clearInterval(el.timer);
        el.timer = setInterval(() => {
            n++;
            for (const name in opt) {
                let cur;
                if (options.easing === 'linear') {
                    const a = n / count;
                    cur = start[name] + dis[name] * a;
                } else if (options.easing === 'ease-in') {
                    const a = n / count;
                    cur = start[name] + dis[name] * a * a * a;
                } else if (options.easing === 'ease-out') {
                    const a = 1 - n / count;
                    cur = start[name] + dis[name] * (1 - a * a * a);
                }
                if (name === 'opacity') {
                    el.style.opacity = cur;
                    el.style.filter = 'alpha(opacity:' + cur * 100 + ')';
                } else el.style[name] = cur + 'px';
            }
            if (n === count) {
                clearInterval(el.timer);
                options.complete && options.complete();
            }
        }, 30);
    },
    getStyle(el, name) {
        return (el.currentStyle || getComputedStyle(el, false))[name];
    },

    // 初始布局转换
    pack(ele, click) {
        if (this.options.pos === false) {
            for (let i = 0; i < ele.length; i++) {
                // $(ele[i]).css('position', 'absolute');
                // $(ele[i]).css('margin', '0');
                this.init(ele[i]);
            }
        } else if (this.options.pos === true) {
            const arr = [];
            if (this.options.random || click) {
                while (arr.length < ele.length) {
                    const n = this.rnd(0, ele.length);
                    if (!this.finInArr(arr, n)) arr.push(n); // 没找到
                }
            }
            if (this.options.random === false || click !== true) {
                let n = 0;
                while (arr.length < ele.length) {
                    arr.push(n);
                    n++;
                }
            }

            // 如果是第二次以后随机列表，那就重新排序后再随机，因为我智商不够使，不会排了
            if (this.firstRandom === false) {
                const sortarr = [];
                let n = 0;
                while (sortarr.length < ele.length) {
                    sortarr.push(n);
                    n++;
                }
                for (let i = 0; i < ele.length; i++) {
                    $(ele[i]).attr('index', sortarr[i]);
                    $(ele[i]).css('left', this.aPos[sortarr[i]].left);
                    $(ele[i]).css('top', this.aPos[sortarr[i]].top);
                }
            }

            // 布局转化
            this.aPos = [];
            if (this.firstRandom === false) {
                // 不是第一次
                for (let j = 0; j < ele.length; j++) {
                    this.aPos[j] = {
                        left:
                            ele[
                                $(ele)
                                    .eq(j)
                                    .attr('index')
                            ].offsetLeft,
                        top:
                            ele[
                                $(ele)
                                    .eq(j)
                                    .attr('index')
                            ].offsetTop
                    };
                }
            } else {
                // 第一次
                for (let j = 0; j < ele.length; j++) this.aPos[j] = { left: ele[j].offsetLeft, top: ele[j].offsetTop };
            }
            // 第二个循环布局转化
            for (let i = 0; i < ele.length; i++) {
                $(ele[i]).attr('index', arr[i]);
                $(ele[i]).css('left', this.aPos[arr[i]].left);
                $(ele[i]).css('top', this.aPos[arr[i]].top);
                $(ele[i]).css('position', 'absolute');
                $(ele[i]).css('margin', '0');
                this.init(ele[i]);
            }
            this.firstRandom = false;
        }
    },
    // 随机数
    rnd(n, m) {
        return parseInt(Math.random() * (m - n) + n, 10);
    },
    // 在数组中找
    finInArr(arr, n) {
        for (let i = 0; i < arr.length; i++) if (arr[i] === n) return true; // 存在
        return false;
    }
};

$.fn.Tdrag = function(opt) {
    const call = {
        scope: null, // 父级
        grid: null, // 网格
        axis: 'all', // 上下或者左右
        pos: false, // 是否记住位置
        handle: null, // 手柄
        moveClass: 'tezml', // 移动时不换位加的class
        dragChange: false, // 是否开启拖拽换位
        changeMode: 'point', // point & sort
        dragStart() {}, // 移动前的回调函数
        dragMove() {}, // 移动中的回调函数
        dragEnd() {}, // 移动结束时候的回调函数
        random: false, // 是否自动随机排序
        randomInput: null, // 点击随机排序的按钮
        animation_options: {
            // 运动时的参数
            duration: 800, // 每次运动的时间
            easing: 'ease-out' // 移动时的特效，ease-out、ease-in、linear
        },
        disable: false, // 禁止拖拽
        disableInput: null // 禁止拖拽的按钮
    };
    const dragfn = new Dragfn(this, opt);
    if (opt && $.isEmptyObject(opt) === false) dragfn.options = $.extend(call, opt);
    else dragfn.options = call;
    dragfn.firstRandom = true;
    dragfn.$element.data('Tdrag', dragfn);
    const ele = dragfn.$element;
    dragfn.pack(ele, false);
    // 加载拓展jquery的函数
    return this;
};
