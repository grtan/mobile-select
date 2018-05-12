;(function () {
    var domDataNS = 'mobileSelect' + (Math.random() + '').replace(/\D/g, ''),
        requestAnimationFrame = Modernizr.prefixed('requestAnimationFrame', window) || function (callback) {
                return setTimeout(callback, 16);
            },
        cancelAnimationFrame = Modernizr.prefixed('cancelAnimationFrame', window) || function (id) {
                clearTimeout(id);
            },
        props = {
            transform: Modernizr.prefixedCSS('transform'),
            transitionDuration: Modernizr.prefixedCSS('transition-duration')
        },
        $ = function (els) {     //给dom添加一些自定义方法
            var list = els.length !== undefined ? [].slice.call(els) : [els];

            list.forEach(function (el) {
                el.css = css;
                el.translateY = translateY;
                el.rotateX = rotateX;
                el.data = data;
                el.index = index;
                el.find = find;
            });

            return list;
        };

    function css(key, value) {
        if (value !== undefined) {
            this.style[Modernizr.prefixedCSS(key)] = value;

            return this;
        } else if (typeof key === 'object') {
            Object.keys(key).forEach(function (k) {
                css.call(this, k, key[k]);
            }, this);

            return this;
        } else {
            return this.style[Modernizr.prefixedCSS(key)];
        }
    }

    function translateY(value) {
        return value !== undefined ? this.css('transform', 'translate3d(0,' + value + ',0)') : (parseFloat(this.css('transform').replace(/^.*translate3d\([^,]*,\s*([\-\.\d]*).*$/, '$1')) || 0);
    }

    function rotateX(value) {
        return value !== undefined ? this.css('transform', 'rotateX(' + value + ')') : (parseFloat(this.css('transform').replace(/^.*rotateX\(([\-\.\d]*).*$/, '$1')) || 0);
    }

    function data(key, value) {
        !this[domDataNS] && (this[domDataNS] = {});

        if (arguments.length > 1) {
            this[domDataNS][key] = value;

            return this;
        } else if (typeof key === 'object') {
            Object.keys(key).forEach(function (k) {
                data.call(this, k, key[k]);
            }, this);

            return this;
        } else {
            return this[domDataNS][key];
        }
    }

    function index() {
        return [].slice.call(this.parentElement.children).indexOf(this);
    }

    function find(selector) {
        return $([].slice.call(document.querySelectorAll(selector)).filter(function (el) {
            var parent = el.parentElement;

            while (parent) {
                if (parent === this) {
                    return true;
                }

                parent = parent.parentElement;
            }
        }, this));
    }

    function extend(target) {
        [].slice.call(arguments, 1).forEach(function (source) {
            Object.keys(source).forEach(function (key) {
                target[key] = source[key];
            });
        });
    }

    /*
     * 缓动函数
     * t: current time（当前时间）；
     * b: beginning value（初始值）；
     * c: change in value（变化量）；
     * d: duration（持续时间）。
     * you can visit 'http://easings.net/zh-cn' to get effect
     */
    var Tween = {
        Cubic: {
            easeOut: function (t, b, c, d) {
                return c * ((t = t / d - 1) * t * t + 1) + b;
            }
        },
        Back: {
            easeOut: function (t, b, c, d, s) {
                s === undefined && (s = 1.15);

                return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
            }
        }
    };

    window.MobileSelect = function (config) {
        extend(this, {
            title: '请选择',   //标题
            duration: 40,   //缓冲动画过程的帧数
            immediateSync: false,   //滑动父列时，是否立即更新子列，false表示等父列滑动停下来后再更新子列
            enable3d: false, //是否开启3d旋转
            spacing: 20    //3d旋转时每个子项之间的角度间距为20deg
        }, config);
        this.init();
    };

    extend(MobileSelect.prototype, {
        init: function () {
            //dom结构
            this.el = $(document.createElement('div'))[0];
            document.body.appendChild(this.el);
            this.el.classList.add('mobile-select');
            this.enable3d && this.el.classList.add('mobile-select-3d');
            this.el.innerHTML = '<div class="mobile-select-box">\
                                    <div class="mobile-select-header">\
                                        <span class="mobile-select-cancel">取消</span>\
                                        <span class="mobile-select-confirm">确定</span>\
                                        <p class="mobile-select-title"></p>\
                                    </div>\
                                    <ul class="mobile-select-labels"></ul>\
                                    <ul class="mobile-select-container"></ul>\
                                </div>';
            this.labels = this.el.find('.mobile-select-labels')[0];
            this.container = this.el.find('.mobile-select-container')[0];
            this.el.find('.mobile-select-title')[0].textContent = this.title; //标题
            this.cascaded = !(this.data instanceof Array);     //是否级联
            this.addEventListener();    //监听事件

            if (this.enable3d) {
                this.radius = this.container.offsetHeight / 2;  //3d旋转的半径
                this.visibleHalfNum = parseInt(90 / this.spacing);  //当前选中的子项上下两边可见的子项的数目
            }

            //初始化各列
            if (this.cascaded) {    //如果是级联关系
                this.updateColumn(0, {
                    name: this.data.name,
                    options: this.data.options.map(function (option) {
                        return option.children ? option.value : option;
                    })
                });
            } else {
                this.data.forEach(function (value, index) {
                    this.updateColumn(index, value);
                }, this);
            }
        },
        updateLabel: function (index, name) {   //更新列时更新label
            var labels = $(this.labels.children),
                label = labels[index];

            if (name) {
                if (!label) {
                    label = $(document.createElement('li'))[0];
                    label.classList.add('mobile-select-label');
                    this.labels.appendChild(label);
                }

                label.textContent = name;
            }

            if (this.cascaded) {
                labels.filter(function (v, i) {
                    return i > (name ? index : index - 1);
                }).forEach(function (el) {
                    el.parentElement.removeChild(el);
                })
            }
        },
        getChildren: function (index, pos) {   //级联关系时获取index列的pos位置的子列数据
            var options = this.data.options;

            $(this.container.children).filter(function (v, i) {
                return i < index;
            }).forEach(function (wrapper) {
                options.some(function (option) {
                    if (option.value === this.data('value')) {
                        options = option.children.options;

                        return true;
                    }
                }, wrapper);
            });

            //没有子列就返回空数组
            return options[pos].children ? {
                name: options[pos].children.name,
                options: options[pos].children.options.map(function (option) {
                    return option.children ? option.value : option;
                })
            } : {
                options: []
            };
        },
        updateColumnPos: function (index, pos) {     //设置index列选中的位置为pos
            var wrappers = $(this.container.children),
                wrapper = wrappers[index],
                list = wrapper.children[0];

            wrapper.data('value', list.children[pos].data('value'));    //设置列选中的值

            if (this.enable3d) {
                list.css('transform', 'translate3d(0,0,-' + this.radius + 'px) rotateX(' + pos * this.spacing + 'deg)');
                this.hiddenItem(list, pos);
            } else {
                list.translateY(-pos * list.offsetHeight + 'px');
            }

            if (this.cascaded) {
                this.updateColumn(index + 1, this.getChildren(index, pos));
            } else if (wrappers.length === this.data.length) {
                //如果不是级联关系，只要所有的列都渲染了，必然是更新值
                this.updateColumn(index + 1, {
                    options: []
                });
            }
        },
        updateColumn: function (index, column) {       //更新列数据
            var wrappers = $(this.container.children),
                wrapper,
                list,
                length,
                result = [];

            //更新label
            this.updateLabel(index, column.name);

            //如果列数据为空，表示需要更新各列的选择值了，并执行回调
            if (!column.options.length) {
                wrappers.filter(function (v, i) {
                    (!this.cascaded || i < index) && result.push(v.data('value'));

                    //如果是级联关系，移除其及其之后的列
                    return this.cascaded && i >= index;
                }, this).forEach(function (el) {
                    el.parentElement.removeChild(el);
                });

                typeof this.update === 'function' && this.update(result);

                return;
            }

            //尽量重用现有的dom，提高性能
            wrapper = wrappers[index];

            if (!wrapper) {
                wrapper = $(document.createElement('li'))[0];
                wrapper.classList.add('mobile-select-wrapper');
                this.container.appendChild(wrapper);
            }

            list = wrapper.children[0];

            if (!list) {
                list = $(document.createElement('ul'))[0];
                list.css('transform', 'translate3d(0,0,-' + this.radius + 'px)');
                list.classList.add('mobile-select-list');
                wrapper.appendChild(list);
            }

            $(list.children).forEach(function (el, i) {
                i < column.options.length ? (el.data('value', column.options[i]).dataset.value = column.options[i]) : el.parentElement.removeChild(el);
            });
            length = list.children.length;
            column.options.slice(length).forEach(function (value, index) {
                var li = $(document.createElement('li'))[0];

                li.classList.add('mobile-select-item');
                //这里必须用data方法设置value，防止改变数据类型
                li.data('value', value).dataset.value = value;
                this.enable3d && li.css('transform', 'rotateX(' + (length + index) * -this.spacing + 'deg) translate3d(0,0,' + this.radius + 'px)');
                list.appendChild(li);
            }, this);
            this.updateColumnPos(index, 0);  //默认选择第一个子项
        },
        hiddenItem: function (list, pos) {     //如果是3d旋转，隐藏不可见的子项
            $(list.children).forEach(function (item, index) {
                Math.abs(index - pos) <= this.visibleHalfNum ? item.classList.add('mobile-select-visible') : item.classList.remove('mobile-select-visible');
            }, this);
        },
        buffer: function (b, c, back) {   //滚动缓冲
            /*
             * t: current time（当前时间）；
             * b: beginning value（初始值）；
             * c: change in value（变化量）；
             * d: duration（持续时间）；
             * back: 是否有回弹
             */
            var wrapper = this.el.data('changing'),
                list = wrapper.children[0],
                items = list.children,
                itemHeight = list.offsetHeight,
                index = wrapper.index(),
                t = 0,
                prevPos,
                update = function () {
                    var position = (back ? Tween.Back.easeOut : Tween.Cubic.easeOut)(t, b, c, this.duration),
                        pos = Math.round(this.enable3d ? (position / this.spacing) : (-position / itemHeight));

                    this.enable3d ? list.css('transform', 'translate3d(0,0,-' + this.radius + 'px) rotateX(' + position + 'deg)') : list.translateY(position + 'px');

                    if (this.enable3d) {
                        pos !== prevPos && this.hiddenItem(list, pos);
                        prevPos = pos;
                    }

                    //更新值
                    if (!this.immediateSync && t === this.duration || this.immediateSync && pos > -1 && pos < items.length && items[pos].data('value') !== wrapper.data('value')) {
                        wrapper.data('value', items[pos].data('value'));    //更新该列的值
                        this.cascaded && this.updateColumn(index + 1, this.getChildren(index, pos));     //更新子列
                    }

                    t < this.duration ? this.rafId = requestAnimationFrame(update) : this.el.data('changing', undefined);
                    t++;
                }.bind(this);

            this.rafId = requestAnimationFrame(update);
        },
        stopChange: function () {   //停止当前滑动列的滑动
            var list, items, pos;

            if (this.el.data('changing')) {
                list = this.el.data('changing').children[0];
                items = list.children;
                pos = Math.round(this.enable3d ? (list.rotateX() / this.spacing) : -(list.translateY() / list.offsetHeight));
                pos < 0 && (pos = 0);
                pos >= items.length && (pos = items.length - 1);
                this.updateColumnPos(this.el.data('changing').index(), pos);
                cancelAnimationFrame(this.rafId);   //requestAnimationFrame还未执行时就可能stopChange
                this.el.data({
                    changing: undefined,
                    touchId: undefined
                });
            }
        },
        setValue: function (items) {   //设置各列的值
            this.stopChange();  //如果有列还在滑动，先停止滑动

            if (this.cascaded) {
                items.forEach(function (value, index) {
                    var pos;

                    if (value !== undefined) {
                        $(this.container.children[index].children[0].children).some(function (v, i) {
                            if (v.data('value') === value) {
                                pos = i;
                                return true;
                            }
                        });
                        this.updateColumnPos(index, pos);
                    }
                }, this);
            } else {
                items.forEach(function (value, index) {
                    value !== undefined && this.updateColumnPos(index, this.data[index].options.indexOf[value]);
                }, this);
            }

            return this;
        },
        addEventListener: function () {
            var prevY, prevTime,
                currentY, currentTime,
                speed,
                wrapper,   //滑动的列
                list,
                items,
                itemHeight, //列中子项的高度
                prev,   //上一次transform的值，rotateX或者translateY
                angle;

            this.el.addEventListener('touchmove', function (event) {
                var flag, distance, pos, touch;

                event.preventDefault();     //阻止滑动

                switch (true) {
                    case event.target.classList.contains('mobile-select-wrapper'):
                        flag = 0;
                        break;
                    case event.target.classList.contains('mobile-select-item'):
                        flag = 1;
                        break;
                    default:
                        flag = -1;
                }

                if (flag !== -1) {  //在wrapper上滑动
                    //获取wrapper
                    wrapper = flag ? event.target.parentElement.parentElement : event.target;

                    if (!this.el.data('changing')) {   //没有列正在变化则开始滑动
                        //记录正在变化的列和触点id
                        this.el.data({
                            changing: wrapper,
                            touchId: event.changedTouches[0].identifier
                        });
                        prevTime = Date.now();
                        prevY = event.changedTouches[0].clientY;
                        list = wrapper.children[0];
                        items = list.children;
                        itemHeight = list.offsetHeight;
                        prev = this.enable3d ? list.rotateX() : list.translateY();
                    } else {
                        touch = [].slice.call(event.changedTouches).filter(function (touch) {
                            return touch.identifier === this.el.data('touchId');
                        }, this)[0];

                        if (touch) {  //同一个触点移动
                            currentTime = Date.now();
                            currentY = touch.clientY;
                            distance = Math.round(currentY - prevY);
                            angle = Math.round((prevY - currentY) / itemHeight * this.spacing);
                            pos = Math.round(this.enable3d ? (prev + angle) / this.spacing : -((prev + distance) / itemHeight));

                            if (this.enable3d) {
                                list.css('transform', 'translate3d(0,0,-' + this.radius + 'px) rotateX(' + (prev + angle) + 'deg)');
                                this.hiddenItem(list, pos);
                            } else {
                                list.translateY((prev + distance) + 'px');
                            }

                            //更新值
                            if (this.immediateSync && pos > -1 && pos < items.length && items[pos].data('value') !== wrapper.data('value')) {
                                wrapper.data('value', items[pos].data('value'));
                                //级联的话，更新子列
                                this.cascaded && this.updateColumn(wrapper.index() + 1, this.getChildren(wrapper.index(), pos));
                            }

                            this.enable3d ? prev += angle : prev += distance;
                            speed = (this.enable3d ? angle : distance) * (1000 / (currentTime - prevTime));
                            prevTime = currentTime;
                            prevY = currentY;
                        } else if (this.el.data('touchId') === undefined && wrapper === this.el.data('changing')) {
                            //引起列滑动的触点已经移除了，并且在当前滚动的列上继续滑动
                            this.stopChange();  //停止当前滑动列的滑动
                        }
                    }
                }
            }.bind(this));

            function touchend(event) {
                var offset, back; //变化量，是否回弹

                if ([].slice.call(event.changedTouches).some(function (touch) {
                        return touch.identifier === this.el.data('touchId');
                    }, this)) {       //同一个触点移除了
                    this.el.data('touchId', undefined);
                    offset = (speed > 0 ? 1 : -1) * Math.pow(Math.abs(speed), 0.75);

                    //获取改变量
                    if (this.enable3d) {
                        switch (true) {
                            case prev < 0:
                                offset = -prev;
                                break;
                            case prev < (items.length - 1) * this.spacing:
                                if (speed < 0 && -offset > prev) {
                                    offset = -prev;
                                    back = true;
                                } else if (speed > 0 && offset > (items.length - 1) * this.spacing - prev) {
                                    offset = (items.length - 1) * this.spacing - prev;
                                    back = true;
                                } else {
                                    offset = Math.round((offset + prev) / this.spacing) * this.spacing - prev;
                                }
                                break;
                            default:
                                offset = (items.length - 1) * this.spacing - prev;
                        }
                    } else {
                        switch (true) {
                            case prev > 0:
                                offset = -prev;
                                break;
                            case prev > (1 - items.length) * itemHeight:
                                if (speed < 0 && offset < (1 - items.length) * itemHeight - prev) {
                                    offset = (1 - items.length) * itemHeight - prev;
                                    back = true;
                                } else if (speed > 0 && offset > -prev) {
                                    offset = -prev;
                                    back = true;
                                } else {
                                    offset = Math.round((offset + prev) / itemHeight) * itemHeight - prev;
                                }
                                break;
                            default:
                                offset = (1 - items.length) * itemHeight - prev;
                        }
                    }

                    this.buffer(prev, offset, back);   //缓冲
                }
            }

            this.el.addEventListener('touchend', touchend.bind(this));
            this.el.addEventListener('touchcancel', touchend.bind(this));

            this.el.addEventListener('click', function (event) {    //点击item
                var target = event.target, current, offset;

                if (target.classList.contains('mobile-select-item') && !this.el.data('changing')) {
                    this.el.data('changing', target.parentElement.parentElement);
                    current = this.enable3d ? target.parentElement.rotateX() : target.parentElement.translateY();
                    offset = target.index() * (this.enable3d ? this.spacing : -target.parentElement.offsetHeight) - current;
                    this.buffer(current, offset);
                }
            }.bind(this));

            this.el.find('.mobile-select-cancel')[0].addEventListener('click', this.hide.bind(this));
            this.el.find('.mobile-select-confirm')[0].addEventListener('click', function () {
                this.hide();
                typeof this.confirm === 'function' && this.confirm($(this.container.children).map(function (el) {
                    return el.data('value');
                }));
            }.bind(this));
            this.el.addEventListener('click', function (event) {
                event.target === this.el && this.hide();
            }.bind(this));
        },
        show: function () {
            this.el.classList.add('mobile-select-show');

            return this;
        },
        hide: function () {
            this.el.classList.remove('mobile-select-show');

            return this;
        },
        destroy: function () {
            this.el.parentElement.removeChild(this.el);
        }
    });
}());