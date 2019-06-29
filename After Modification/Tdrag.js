/*! Tdrag 0.0.1 */
/**
 * Created by Tezml on 2016/5/26
 * You can modify my source code, if you have a good idea or a problem can be encountered by e-mail: tezml@tezml.com to find me.
 * 如果你想在项目中使用该插件，请不要删除该注释。
 */
(function($, window, document) {
    jQuery(() => {
        // 依赖构造函数
        const Dragfn = function (ele, opt) {
            this.$element = ele;
            this.options = opt;
        };
        // 构造函数方法
        Dragfn.prototype = {
            init (obj) {
                const self = this;
                self.ele=self.$element;
                self.handle=$(obj);// 手柄
                self.options = self.options;
                self.disable = self.options.disable;
                self._start = false;
                self._move = false;
                self._end = false;
                self.disX = 0;
                self.disY = 0;
                // self.zIndex=10;
                self.moving=false;
                self.moves="";


                // 父级
                self.box = $.type(self.options.scope)==="string" ? self.options.scope : null;
                // 手柄
                if(self.options.handle!==null)
                    self.handle=$(obj).find(self.options.handle);


                // 三个事件
                self.handle.on("mousedown", ev => {
                    self.start(ev, obj);
                    obj.setCapture && obj.setCapture();
                    return false;
                });
                if(self.options.dragChange) {
                    $(obj).on("mousemove", ev => {
                        self.move(ev, obj);
                    });
                    $(obj).on("mouseup", ev => {
                        self.end(ev, obj);
                    });
                }else{
                    $(document).on("mousemove", ev => {
                        self.move(ev, obj);
                    });
                    $(document).on("mouseup", ev => {
                        self.end(ev, obj);
                    });
                }
            },
            // jquery调取函数时候用
            loadJqueryfn() {
                const self=this;
                $.extend({
                    // 返回按照index排序的回调函数
                    sortBox(obj) {
                        const arr=[];
                        for (let s = 0; s < $(obj).length; s++)
                            arr.push($(obj).eq(s));

                        for ( let i = 0; i < arr.length; i++) {
                            for ( let j = i + 1; j < arr.length; j++) {
                                if(Number(arr[i].attr("index")) > Number(arr[j].attr("index"))) {
                                    const temp = arr[i];
                                    arr[i] = arr[j];
                                    arr[j] = temp;
                                }
                            }
                        }
                        return arr;
                    },
                    // 随机排序函数
                    randomfn(obj) {
                        self.pack($(obj), true);
                    },
                    // 开启拖拽
                    disable_open() {
                        self.disable=false;
                    },
                    // 禁止拖拽
                    disable_cloose() {
                        self.disable=true;
                    }
                });
            },
            toDisable() {
                const self=this;
                if(self.options.disableInput!==null) {
                    $(self.options.disableInput).bind("click", () => {
                        if(self.disable===true)
                            self.disable=false;
                        else
                            self.disable=true;
                    });
                }
            },
            start (ev, obj) {
                const self = this;
                self.moved=obj;
                if (self.disable === true)
                    return false;

                self._start = true;
                const oEvent = ev || event;
                self.disX = oEvent.clientX - obj.offsetLeft;
                self.disY = oEvent.clientY - obj.offsetTop;
                // $(obj).css("zIndex", self.zIndex++);
                self.options.dragStart(ev, obj);
            },
            move (ev, obj) {
                const self = this;
                if (self._start !== true)
                    return false;

                if(obj!==self.moved)
                    return false;

                self._move = true;
                const oEvent = ev || event;
                let l = oEvent.clientX - self.disX;
                let t = oEvent.clientY - self.disY;
                // 有父级限制
                if (self.box !== null) {
                    const rule = self.collTestBox(obj, self.box);
                    if (l > rule.lmax)
                        l = rule.lmax;
                     else if (l < rule.lmin)
                        l = rule.lmin;

                    if (t > rule.tmax)
                        t = rule.tmax;
                     else if (t < rule.tmin)
                        t = rule.tmin;
                }
                if(self.options.axis==="all") {
                    obj.style.left = self.grid(obj, l, t).left + 'px';
                    obj.style.top = self.grid(obj, l, t).top + 'px';
                }else if(self.options.axis==="y")
                    obj.style.top = self.grid(obj, l, t).top + 'px';
                else if(self.options.axis==="x")
                    obj.style.left = self.grid(obj, l, t).left + 'px';

               /* if(self.options.changeWhen==="move") {
                    if (self.options.changeMode === "sort") {
                        self.sortDrag(obj);
                    } else if (self.options.changeMode === "point") {
                        self.pointmoveDrag(obj);
                    }
                }else{
                    self.moveAddClass(obj);
                } */
                if(self.options.pos===true)
                    self.moveAddClass(obj);

                self.options.dragMove(ev, obj);
            },
            end (ev, obj) {
                const self = this;
                if (self._start !== true)
                    return false;

                if(self.options.changeMode==="sort"&&self.options.pos===true)
                    self.dragDrag(obj);
                else if(self.options.changeMode==="point"&&self.options.pos===true)
                    self.pointDrag(obj);

                if(self.options.pos===true)
                    self.animation(obj, self.aPos[$(obj).attr("index")]);

                self.options.dragEnd(ev, obj);
                if(self.options.handle!==null) {
                    $(obj).find(self.options.handle).unbind("onmousemove");
                    $(obj).find(self.options.handle).unbind("onmouseup");
                }else{
                    $(obj).unbind("onmousemove");
                    $(obj).unbind("onmouseup");
                }
                obj.releaseCapture && obj.releaseCapture();
                self._start = false;
            },
            // 算父级的宽高
            collTestBox (obj, obj2) {
                // const self = this;
                const l1 = 0;
                const t1 = 0;
                const l2 = $(obj2).innerWidth() - $(obj).outerWidth();
                const t2 = $(obj2).innerHeight() - $(obj).outerHeight();
                return {
                    lmin: l1, // 取的l最小值
                    tmin: t1, // 取的t最小值
                    lmax: l2, // 取的l最大值
                    tmax: t2// 取的t最大值
                };
            },
            // 算父级宽高时候干掉margin
            grid (obj, l, t) { // cur:[width,height]
                const self = this;
                const json = {
                    left: l,
                    top: t
                };
                if ($.isArray(self.options.grid) && self.options.grid.length === 2) {
                    const gx = self.options.grid[0];
                    const gy = self.options.grid[1];
                    json.left = Math.floor((l + gx / 2) / gx) * gx;
                    json.top = Math.floor((t + gy / 2) / gy) * gy;
                    return json;
                } if (self.options.grid === null)
                    return json;

                    console.log("grid参数传递格式错误");
                    return false;
            },
            findNearest(obj) {
                const self=this;
                let iMin=new Date().getTime();
                let iMinIndex=-1;
                const ele=self.ele;
                for(let i=0;i<ele.length;i++) {
                    if(obj===ele[i])
                        continue;

                    if(self.collTest(obj, ele[i])) {
                        const dis=self.getDis(obj, ele[i]);
                        if(dis<iMin) {
                            iMin=dis;
                            iMinIndex=i;
                        }
                    }
                }
                if(iMinIndex===-1)
                    return null;

                    return ele[iMinIndex];
        },
            getDis(obj, obj2) {
                // const self=this;
                const l1=obj.offsetLeft+obj.offsetWidth/2;
                const l2=obj2.offsetLeft+obj2.offsetWidth/2;

                const t1=obj.offsetTop+obj.offsetHeight/2;
                const t2=obj2.offsetTop+obj2.offsetHeight/2;

                const a=l2-l1;
                const b=t1-t2;

            return Math.sqrt(a*a+b*b);
        },
            collTest(obj, obj2) {
                // const self=this;
                const l1=obj.offsetLeft;
                const r1=obj.offsetLeft+obj.offsetWidth;
                const t1=obj.offsetTop;
                const b1=obj.offsetTop+obj.offsetHeight;

                const l2=obj2.offsetLeft;
                const r2=obj2.offsetLeft+obj2.offsetWidth;
                const t2=obj2.offsetTop;
                const b2=obj2.offsetTop+obj2.offsetHeight;

                if(r1<l2 || r2<l1 || t2>b1 || b2<t1)
                    return false;

                    return true;
        },
            // 初始布局转换
            pack(ele, click) {
                const self=this;
                self.toDisable();
                if(self.options.pos===false) {
                    for (let i = 0; i < ele.length; i++) {
                        $(ele[i]).css("position", "absolute");
                        // $(ele[i]).css("margin", "0");
                        self.init(ele[i]);
                    }
                }else if(self.options.pos===true) {
                    const arr = [];
                    if (self.options.random || click) {
                        while (arr.length < ele.length) {
                            const n = self.rnd(0, ele.length);
                            if (!self.finInArr(arr, n)) { // 没找到
                                arr.push(n);
                            }
                        }
                    }
                    if (self.options.random === false || click !== true) {
                        let n = 0;
                        while (arr.length < ele.length) {
                            arr.push(n);
                            n++;
                        }
                    }

                    // 如果是第二次以后随机列表，那就重新排序后再随机，因为我智商不够使，不会排了
                    if (self.firstRandom === false) {
                        const sortarr = [];
                        let n = 0;
                        while (sortarr.length < ele.length) {
                            sortarr.push(n);
                            n++;
                        }
                        for (let i = 0; i < ele.length; i++) {
                            $(ele[i]).attr("index", sortarr[i]);
                            $(ele[i]).css("left", self.aPos[sortarr[i]].left);
                            $(ele[i]).css("top", self.aPos[sortarr[i]].top);
                        }
                    }

                    // 布局转化
                    self.aPos = [];
                    if (self.firstRandom === false) {
                        // 不是第一次
                        for (let j = 0; j < ele.length; j++) {
                            self.aPos[j] = {
                                left: ele[$(ele).eq(j).attr("index")].offsetLeft,
                                top: ele[$(ele).eq(j).attr("index")].offsetTop
                            };
                        }
                    } else {
                        // 第一次
                        for (let j = 0; j < ele.length; j++)
                            self.aPos[j] = {left: ele[j].offsetLeft, top: ele[j].offsetTop};
                    }
                    // 第二个循环布局转化
                    for (let i = 0; i < ele.length; i++) {
                        $(ele[i]).attr("index", arr[i]);
                        $(ele[i]).css("left", self.aPos[arr[i]].left);
                        $(ele[i]).css("top", self.aPos[arr[i]].top);
                        $(ele[i]).css("position", "absolute");
                        // $(ele[i]).css("margin", "0");
                        self.init(ele[i]);
                    }
                    self.firstRandom = false;
                }
            },
            // 移动时候加class
            moveAddClass(obj) {
                const self=this;
                const oNear=self.findNearest(obj);
                $(self.$element).removeClass(self.options.moveClass);
                if(oNear && $(oNear).hasClass(self.options.moveClass)===false)
                    $(oNear).addClass(self.options.moveClass);
            },
            // 给li排序
            sort() {
                const self=this;
                const arr_li=[];
                for (let s = 0; s < self.$element.length; s++)
                    arr_li.push(self.$element[s]);

                for ( let i = 0; i < arr_li.length; i++) {
                    for ( let j = i + 1; j < arr_li.length; j++) {
                        if(Number($(arr_li[i]).attr("index")) > Number($(arr_li[j]).attr("index"))) {
                            const temp = arr_li[i];
                            arr_li[i] = arr_li[j];
                            arr_li[j] = temp;
                        }
                    }
                }
                return arr_li;
            },
            // 点对点的方式换位
            pointDrag(obj) {
                const self=this;
                // 先拍序
                const oNear=self.findNearest(obj);
                if (oNear) {
                    self.animation(obj, self.aPos[$(oNear).attr("index")]);
                    self.animation(oNear, self.aPos[$(obj).attr("index")]);
                    const tmp = $(obj).attr("index");
                    $(obj).attr("index", $(oNear).attr("index"));
                    $(oNear).attr("index", tmp);
                    $(oNear).removeClass(self.options.moveClass);
                } else if (self.options.changeWhen === "end")
                    self.animation(obj, self.aPos[$(obj).attr("index")]);
            },
            // 排序的方式换位
            sortDrag(obj) {
                const self=this;
                // 先拍序
                const arr_li=self.sort();
                // 换位置
                const oNear=self.findNearest(obj);
                    if(oNear) {
                        if(Number($(oNear).attr("index"))>Number($(obj).attr("index"))) {
                            // 前换后
                            const obj_tmp=Number($(obj).attr("index"));
                            $(obj).attr("index", Number($(oNear).attr("index"))+1);
                            for (let i = obj_tmp; i < Number($(oNear).attr("index"))+1; i++) {
                                self.animation(arr_li[i], self.aPos[i-1]);
                                self.animation(obj, self.aPos[$(oNear).attr("index")]);
                                $(arr_li[i]).removeClass(self.options.moveClass);
                                $(arr_li[i]).attr("index", Number($(arr_li[i]).attr("index"))-1);
                            }
                        }else if(Number($(obj).attr("index"))>Number($(oNear).attr("index"))) {
                            // 后换前
                            const obj_tmp=Number($(obj).attr("index"));
                            $(obj).attr("index", $(oNear).attr("index"));
                            for (let i = Number($(oNear).attr("index")); i < obj_tmp; i++) {
                                self.animation(arr_li[i], self.aPos[i+1]);
                                self.animation(obj, self.aPos[Number($(obj).attr("index"))]);
                                $(arr_li[i]).removeClass(self.options.moveClass);
                                $(arr_li[i]).attr("index", Number($(arr_li[i]).attr("index"))+1);
                            }
                        }
                    }else
                        self.animation(obj, self.aPos[$(obj).attr("index")]);
            },
            // 运动函数(后期再加参数)
            animation(obj, json) {
                // 考虑默认值
                const self=this;
                const options=self.options.animation_options; /* || {};
                options.duration=self.options.animation_options.duration || 800;
                options.easing=options.easing.duration.easing || 'ease-out'; */
                const count=Math.round(options.duration/30);
                const start={};
                const dis={};
                for(const name in json) {
                    start[name]=parseFloat(self.getStyle(obj, name));
                    if(isNaN(start[name])) {
                        switch(name) {
                            case 'left':
                                start[name]=obj.offsetLeft;
                                break;
                            case 'top':
                                start[name]=obj.offsetTop;
                                break;
                            case 'width':
                                start[name]=obj.offsetWidth;
                                break;
                            case 'height':
                                start[name]=obj.offsetHeight;
                                break;
                            case 'marginLeft':
                                start[name]=obj.offsetLeft;
                                break;
                            case 'borderWidth':
                                start[name]=0;
                                break;
                            // ...
                        }
                    }
                    dis[name]=json[name]-start[name];
                }

                let n=0;

                clearInterval(obj.timer);
                let a = "";
                let cur = "";
                obj.timer=setInterval(() => {
                    n++;
                    for(const name in json) {
                        switch(options.easing) {
                            case 'linear':
                                a=n/count;
                                cur=start[name]+dis[name]*a;
                                break;
                            case 'ease-in':
                                a=n/count;
                                cur=start[name]+dis[name]*a*a*a;
                                break;
                            case 'ease-out':
                                a=1-n/count;
                                cur=start[name]+dis[name]*(1-a*a*a);
                                break;
                        }

                        if(name==='opacity') {
                            obj.style.opacity=cur;
                            obj.style.filter='alpha(opacity:'+cur*100+')';
                        }else
                            obj.style[name]=cur+'px';
                    }

                    if(n===count) {
                        clearInterval(obj.timer);
                        options.complete && options.complete();
                    }
                }, 30);
        },
            getStyle(obj, name) {
                return (obj.currentStyle || getComputedStyle(obj, false))[name];
            },
            // 随机数
            rnd(n, m) {
                return parseInt(Math.random()*(m-n)+n);
            },
            // 在数组中找
            finInArr(arr, n) {
                for(let i = 0 ; i < arr.length; i++) {
                    if(arr[i] === n) { // 存在
                        return true;
                    }
                }
                return false;
            }
        };
        // 插件制作
        $.fn.Tdrag = function (opt) {
            const call = {
                scope: null, // 父级
                grid: null, // 网格
                axis:"all", // 上下或者左右
                pos:false, // 是否记住位置
                handle:null, // 手柄
                moveClass:"", // 移动时不换位加的class
                dragChange:false, // 是否开启拖拽换位
                changeMode:"point", // point & sort
                dragStart(e, obj) {}, // 移动前的回调函数
                dragMove(e, obj) {}, // 移动中的回调函数
                dragEnd(e, obj) {}, // 移动结束时候的回调函数
                random:false, // 是否自动随机排序
                randomInput:null, // 点击随机排序的按钮
                animation_options:{// 运动时的参数
                    duration:800, // 每次运动的时间
                    easing:"ease-out"// 移动时的特效，ease-out、ease-in、linear
                },
                disable:false, // 禁止拖拽
                disableInput:null// 禁止拖拽的按钮
            };
            const dragfn = new Dragfn(this, opt);
            if (opt && $.isEmptyObject(opt) === false)
                dragfn.options = $.extend(call, opt);
                else
                dragfn.options = call;

            dragfn.firstRandom=true;
            const ele = dragfn.$element;
            dragfn.pack(ele, false);
            if(dragfn.options.randomInput!==null) {
                $(dragfn.options.randomInput).bind("click", () => {
                    dragfn.pack(ele, true);
                });
            }
            // 加载拓展jquery的函数
            dragfn.loadJqueryfn();
        };
    });
})(jQuery, window, document);
