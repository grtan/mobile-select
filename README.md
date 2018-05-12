# mobile-select

> 移动端选择组件，支持级联（类似省市区）与非级联

## 引入

由于组件用到了modernizr的prefixed功能，所以需要引入modernizr.js

```
<link rel="stylesheet" href="index.css">
<script src="modernizr.js"></script>
<script src="index.js"></script>
```

## 使用

```
var select = new MobileSelect({
        title: '请选择',
        data: function () {
            var num = 3;

            function deep() {
                var index = arguments[0] || 0,
                    data = {
                        name: 'label' + index,
                        options: []
                    };

                for (var i = 0; i < 50; i++) {
                    data.options.push((index < num - 1) && Math.random() > 0.5 ? {
                        value: index + '-' + (arguments[1] || 0) + '-' + i,
                        children: deep(index + 1, i)
                    } : index + '-' + (arguments[1] || 0) + '-' + i);
                }

                return data;
            }

            return deep();
        }(),
        update: function (value) {
            console.log('update', value);
        },
        confirm: function (value) {
            console.log('confirm', value);
        }
    });

select.show();  //显示
select.hide();  //隐藏
select.destroy();  //销毁
```

## 参数

名称|类型|必填|默认值|描述
:-:|:-:|:-:|:-:|:-:
title|String|N|请选择|标题
data|Array或Object|Y|-|数据
immediateSync|Boolean|N|false|如果是级联关系时，滑动父列时是否立即更新子列，false表示等父列滑动停下来后再更新子列
enable3d|Boolean|N|false|是否开启3d旋转
spacing|Number|N|20|开启3d旋转时，每列子项之间的角度间隔，单位为deg
update|Function|N|-|数据更新时的回调函数
confirm|Function|N|-|点击确定按钮时的回调函数

data为Array时（**非级联关系**）如下

名称|类型|必填|默认值|描述
:-:|:-:|:-:|:-:|:-:
data[{name}]|String|N|-|列名称，没有则不显示列名称
data[{options}]|Array|Y|-|列数据，每一项为字符串

例如

```
[{
    name: '年',
    options: [1, 2, 3, 4, 5, 6]
}, {
    name: '月',
    options: [1, 2, 3, 4, 5, 6]
}, {
    name: '日',
    options: [1, 2, 3, 4, 5, 6]
}]
```

data为Object时（**级联关系**）如下

名称|类型|必填|默认值|描述
:-:|:-:|:-:|:-:|:-:
{name}|String|N|-|列名称，没有则不显示列名称
{options}|Array|Y|-|列数据，每一项为对象
{options{value}}|String|Y|-|每一项的数据
{options{children}}|Object（**重复data结构**）|N|-|级联子列的配置，没有则无子列

例如

```
{
    name: '年',
    options: [{
        value: 2016,
        children: {
            name: '月',
            options: [{
                value: 11,
                children: {
                    name: '日',
                    options: [1, 2, 3, 4, 5, 6]
                }
            }, {
                value: 12,
                children: {
                    name: '日',
                    options: [1, 2, 3, 4, 5, 6]
                }
            }]
        }
    }, {
        value: 2017,
        children: {
            name: '月',
            options: [{
                value: 11,
                children: {
                    name: '日',
                    options: [1, 2, 3, 4, 5, 6]
                }
            }, {
                value: 12,
                children: {
                    name: '日',
                    options: [1, 2, 3, 4, 5, 6]
                }
            }]
        }
    }]
}
```

## 回调函数

名称|参数|描述
:-:|:-:|:-:
update|{value}|数据更新（**非级联关系时，只要任一列选择的数据改变；级联关系时，最后一列选择的数据改变**）时触发，value是一个数组，元素依次为选择的列数据
confirm|{value}|点击确定按钮时触发，value是一个数组，元素依次为选择的列数据

## 方法

名称|参数|描述
:-:|:-:|:-:
show|-|显示组件
hide|-|隐藏组件
destroy|-|销毁组件
setValue|{value}|设置选中的值，value是一个数组，元素依次为选择的列数据
