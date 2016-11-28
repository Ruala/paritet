/**
 * Created by user on 26.11.2016.
 */
/*
* слайдер +
* меню +
* фикс меню +
* фенсибокс +
* валидация +
* стилизировать валидацию
* кнопка вверх +
* стили на слайдер
* оптимизация картинок
* вынести критический css
* */

'use strict';

/* Polyfills */
/* closest for IE8+ */
(function () {
    'use strict';
    
    if(!Element.prototype.closest) {
        Element.prototype.closest = function (selector) {
            var elem = this;
            
            do {
                if (elem.matches(selector)) {
                    return elem;
                }
                
                elem = elem.parentElement;
            } while (elem);
            
            return null;
        };
    }
})();
/* matches for IE8+ */
(function () {
    'use strict';
    
    if (!Element.prototype.matches) {
        Element.prototype.matches = function (selector) {
            var elemColl = this.parentNode.querySelectorAll(selector);
            
            for(var i = 0; i < elemColl.length; i++) {
                if (elemColl[i] === this) return true;
            }
            
            return false;
        }
    }
})();
/*classList for IE9+ */
(function(){
    /*
     * Minimal classList shim for IE 9
     * By Devon Govett
     * MIT LICENSE
     */
    
    
    if (!("classList" in document.documentElement) && Object.defineProperty && typeof HTMLElement !== 'undefined') {
        Object.defineProperty(HTMLElement.prototype, 'classList', {
            get: function() {
                var self = this;
                function update(fn) {
                    return function(value) {
                        var classes = self.className.split(/\s+/),
                            index = classes.indexOf(value);
                        
                        fn(classes, index, value);
                        self.className = classes.join(" ");
                    }
                }
                
                var ret = {
                    add: update(function(classes, index, value) {
                        ~index || classes.push(value);
                    }),
                    
                    remove: update(function(classes, index) {
                        ~index && classes.splice(index, 1);
                    }),
                    
                    toggle: update(function(classes, index, value) {
                        ~index ? classes.splice(index, 1) : classes.push(value);
                    }),
                    
                    contains: function(value) {
                        return !!~self.className.split(/\s+/).indexOf(value);
                    },
                    
                    item: function(i) {
                        return self.className.split(/\s+/)[i] || null;
                    }
                };
                
                Object.defineProperty(ret, 'length', {
                    get: function() {
                        return self.className.split(/\s+/).length;
                    }
                });
                
                return ret;
            }
        });
    }
})();



/*Form class*/
(function(){
    function FormController(options) {
        this._submitSelector = options.submitSelector || 'input[type="submit"]';
        this._listenedBlock = options.listenedBlock || 'body';
        this._resetForm = options.resetForm || true;
        this._beforeSend = options.beforeSend || null;
        this._resolve = options.resolve || null;
        this._reject = options.reject || null;
        this._maxFileSize = options.maxFileSize || 2; //MB
    }
    FormController.prototype.init = function () {
        if(!document.querySelector(this._submitSelector)) return;
        
        $(this._listenedBlock).click(this.formListeners.bind(this));
        
        if($(this._listenedBlock).find('input[type="file"]').length) {
            $(this._listenedBlock).change(this.uploadListener.bind(this));
        }
    };
    FormController.prototype.validateForm = function (form) {
        var vResult = true;
        var passCurr = false;
        var self = this;
        
        $('input[name!="submit"], textarea', $(form)).each(function () {
            var vVal = $(this).val();
            var requiredField = $(this).attr('required');
            var pattern = '';
            var placeholderMess = '';
            
            $(this).removeClass('form-fail'); //чистим классы, если остались после прошлого раза
            $(this).removeClass('form-success');
            
            
            if (vVal.length === 0 && requiredField) {
                placeholderMess = 'Поле ' + ($(this).attr('data-name') ? '"' + $(this).attr('data-name') + '" ' : '') + 'обязательное!';
                vResult = false;
            } else if ($(this).attr('name') == 'email' && vVal.length) {
                pattern = /^([a-z0-9_\.-])+@[a-z0-9-]+\.([a-z]{2,4}\.)?[a-z]{2,4}$/i;
                
                if (pattern.test($(this).val())) {
                    $(this).addClass('form-success');
                } else {
                    placeholderMess = 'Введите корректный E-mail!';
                    vResult = false;
                }
            } else if ($(this).attr('name') == 'phone' && vVal.length) {
                pattern = /^((8|\+7)[\- ]?)?(\(?\d{3}\)?[\- ]?)?[\d\- ]{7,10}$/i;
                
                if (pattern.test($(this).val())) {
                    $(this).addClass('form-success');
                } else {
                    placeholderMess = 'Введите корректный телефон!';
                    vResult = false;
                }
            } else if ($(this).attr('name') === 'passCurr' && vVal.length) {
                passCurr = this;
            } else if ($(this).attr('name') === 'passNew' && vVal.length) {
                if (vVal === $(passCurr).val()) {
                    $(passCurr).val('').addClass('form-fail').attr('placeholder', 'Новый пароль, не должен совпадать с текущим!');
                    placeholderMess = 'Новый пароль, не должен совпадать с текущим!';
                } else {
                    $(this).addClass('form-success');
                    $(passCurr).addClass('form-success');
                }
            }else if($(this).is('textarea') && vVal.length < 10 && vVal.length > 0  && requiredField) {
                placeholderMess = 'Сообщение слишком короткое!';
                vResult = false;
            } else if (requiredField && vVal.length) {
                $(this).addClass('form-success');
            }
            
            if (placeholderMess) {
                $(this).attr('data-old-placeholder', $(this).attr('placeholder'));
                $(this).val('').attr('placeholder', placeholderMess).addClass('form-fail');
                placeholderMess = '<span class="form-fail">' + placeholderMess + '</span>';
                self.changeLabel(this, placeholderMess, 'span.placeholder');
            }
        });
        
        return vResult;
    };
    FormController.prototype.uploadListener = function (e) {
        var elem = e.target;
        
        if(!elem.matches('input[type="file"]'))  return;
        
        var size = this.getFileSize(elem);
        
        if (size < this._maxFileSize * 1024 * 1024) return;
        
        alert("Файл слишком большой. Размер вашего файла " + (size / 1024 / 1024).toFixed(2) +
            " MB. Загружайте файлы меньше " + this._maxFileSize + "MB.");
        $(elem).val('');
    };
    FormController.prototype.getFileSize = function (input) {
        var file;
        
        if (typeof ActiveXObject == "function") { // IE
            file = (new ActiveXObject("Scripting.FileSystemObject")).getFile(input.value);
        } else {
            file = input.files[0];
        }
        
        return file.size;
    };
    FormController.prototype.changeLabel = function (elem, val, insideLabelSelector) {
        var selector = 'label[for="' + $(elem).attr('id') + '"] ' + insideLabelSelector || '';
        var $label = $(selector);
        
        if ($label.length) {
            $label.each(function () {
                this.innerHTML = val;
            });
        }
    };
    FormController.prototype.resetForms = function (formContainer) {
        var $form;
        var self = this;
        
        if (formContainer.tagName === 'FORM') {
            $form = $(formContainer);
        } else {
            $form = $('form', $(formContainer));
        }
        
        $form.each(function () {
            self.resetPlaceholders(this);
            if (self._resetForm) {
                this.reset();
                self.triggerChange(this);
            }
        });
    };
    FormController.prototype.resetPlaceholders = function (inputContainer) {
        var self = this;
        var $input;
        
        if (inputContainer.tagName === 'INPUT') {
            $input = $(inputContainer);
        } else {
            $input = $('input[name != submit]', $(inputContainer));
        }
        
        $input.each(function () {
            var name = $(this).attr('name');
            var placeholderMess =  $(this).attr('data-old-placeholder');
            
            $(this).removeClass('form-success');
            $(this).removeClass('form-fail');
            
            if (!placeholderMess) return;
            
            $(this).attr('placeholder', placeholderMess);
            self.changeLabel(this, placeholderMess, 'span.placeholder');
        });
    };
    FormController.prototype.triggerChange = function (inputContainer) {
        var $input = null;
        
        if (inputContainer.tagName === 'INPUT') {
            $input = $(inputContainer);
        } else {
            $input = $('input[name != submit]', $(inputContainer));
        }
        
        $input.each(function () {
            $(this).trigger('change');
        });
    };
    FormController.prototype.formListeners = function (e) {
        var elem = e.target;
        
        if (!elem.matches(this._submitSelector)) return;
        
        e.preventDefault();
        
        var form = elem.closest('form');
        
        if (this.validateForm(form)) {
            this.sendRequest(form, this._resolve, this._reject, this._beforeSend);
        }
    };
    FormController.prototype.sendRequest = function (form, resolve, reject, beforeSend) {
        var formData = $(form).serializeArray(); //собираем все данные из формы
        var self = this;
        
        
        if (beforeSend) {
            beforeSend.call(this, formData, form);
        }
        //console.dir(formData);
        
        this.showPending(form);
        
        $.ajax({
            type: form.method,
            url: form.action,
            data: $.param(formData),
            success: function (response) {
                //console.log(response);
                
                if (response) {
                    self.hidePending(form, self.showSuccess.bind(self, form));
                    
                    if (resolve) {
                        resolve.call(self, form, response);
                    }
                } else {
                    self.hidePending(form, self.showError.bind(self, form));
                    
                    if (reject) {
                        reject.call(self, form, response);
                    }
                }
                
                self.resetForms(form);
            },
            error: function (response) {
                
                //console.log(response);
                //throw new Error(response.statusText);
                self.hidePending(form, self.showError.bind(self, form));
                self.resetForms(form);
                
            }
        });
    };
    FormController.prototype.showError = function (form) {
        var $errBlock = $('.err-block', $(form));
        
        $('.form-success', $(form)).removeClass('form-success');
        $errBlock.fadeIn('normal');
        
        setTimeout(function () {
            $errBlock.fadeOut('normal');
        }, 10000);
    };
    FormController.prototype.showSuccess = function (form) {
        var $succBlock = $('.succ-block', $(form));
        
        $('.form-success', $(form)).removeClass('form-success');
        $succBlock.fadeIn('normal');
        
        setTimeout(function () {
            $succBlock.fadeOut('normal');
        }, 10000);
    };
    FormController.prototype.showPending = function (form) {
        var $pendingBlock = $('.pend-block', $(form));
        
        $pendingBlock.fadeIn('normal');
    };
    FormController.prototype.hidePending = function (form, callback) {
        var $pendingBlock = $('.pend-block', $(form));
        
        if (!$pendingBlock[0]) {
            callback();
            return;
        }
        
        $pendingBlock.fadeOut('normal', 'linear', callback);
    };
    
    $.fn.formController = function () {
        var options = typeof arguments[0] === 'object' ? arguments[0] : {};
        
        $(this).each(function () {
            options.listenedBlock = this;
            
            var controller = new FormController(options);
            controller.init();
        });
    };
})();

/*Fixed menu class*/
(function(){
    function FixedMenu(options) {
        this._menu = options.menu;
        this._fixedClass = options.fixedClass || 'js-top-fixed';
        this._menuIsFixed = false;
        this._staticMenuPosition = -1;
        this._isPageSearch = options.pageSearch || true;
    }
    FixedMenu.prototype.init = function () {
        var setActiveLi = this.pageScrollListener();
        
        $(window).on({
            'load': function () {
                this.getStaticMenuPos();
                setActiveLi();
            }.bind(this),
            'scroll': function () {
                this.toggleMenuPosition();
                setActiveLi();
            }.bind(this),
            'resize': this.getStaticMenuPos.bind(this)
        });
    };
    FixedMenu.prototype.getCoords = function (elem) {
        var box = elem.getBoundingClientRect();
        
        return {
            top: box.top + pageYOffset,
            left: box.left + pageXOffset
        };
    };
    FixedMenu.prototype.toggleMenuPosition = function (off) {
        var $menu = $(this._menu);
        
        if ($menu.is(':hidden')) return;
        
        if (window.pageYOffset <= this._staticMenuPosition && this._menuIsFixed || off) {
            $menu.removeClass(this._fixedClass);
            this._menuIsFixed = false;
            return;
        } else if (window.pageYOffset > this._staticMenuPosition && !this._menuIsFixed){
            $menu.addClass(this._fixedClass);
            this._menuIsFixed = true;
        }
    };
    FixedMenu.prototype.pageScrollListener = function () {
        var activeLink = null;
        var activeSection = null;
        var links = this._menu.querySelectorAll('a[href^="#"]');
        var self = this;
        
        return function () {
            if (!self._isPageSearch) return;
            if ($(self._menu).is(':hidden')) return;
            
            var coordsMenu = self._menu.getBoundingClientRect();
            var elem = document.elementFromPoint(self._menu.offsetWidth/2, coordsMenu.bottom + 50);
            
            if (!elem && activeLink) {
                activeLink.closest('li').classList.remove('active');
                activeLink = null;
                activeSection = null;
                return;
            } else if (!elem) {
                return;
            }
            
            if (activeLink && activeSection && activeSection.contains(elem)) {
                return;
            }
            
            for (var i = 0; i < links.length; i++) {
                var href = links[i].getAttribute('href');
                
                if(href.length < 2) continue;
                
                var targetSection = elem.closest(href);
                
                if (targetSection) {
                    if (activeLink) {
                        activeLink.closest('li').classList.remove('active');
                    }
                    activeSection = targetSection;
                    activeLink = links[i];
                    activeLink.closest('li').classList.add('active');
                    return;
                }
            }
            
            if(activeLink) {
                activeLink.closest('li').classList.remove('active');
                activeLink = null;
                activeSection = null;
            }
            
        };
    };
    FixedMenu.prototype.getStaticMenuPos = function () {
        if ($(this._menu).is(':hidden')) return;
        
        this.toggleMenuPosition(true);
        this._staticMenuPosition = this.getCoords(this._menu).top;
        this.toggleMenuPosition();
    };
    
    $.fn.fixedMenu = function () {
        var options = typeof arguments[0] === 'object' ? arguments[0] : {};
        
        $(this).each(function () {
            options.menu = this;
            
            var controller = new FixedMenu(options);
            controller.init();
        });
    };
})();


$(document).ready(function () {
    /*slider*/
    (function(){
    	var $mainPageHeaderSlider = $('.pageheader__slider');
        var $workProcessSlider = $('.work-process__slider');
        var options = {
            fade: true,
            autoplay: true,
            autoplaySpeed: 3000,
            responsive: [
                {
                    breakpoint: 767,
                    settings: {
                        arrows: false
                    }
                }
            ]
        };
        
        $(window).on('load', function () {
            $mainPageHeaderSlider.slick(options);
            $workProcessSlider.slick(options);
        });
    })();
    
    /*fancybox*/
    (function(){
    	var $lightbox = $('[data-component="fancybox"]');
        
        $lightbox.fancybox();
    })();
    
    /*form*/
    (function(){
        var $inputPhone = $('[name="phone"]');
        var $contactForm = $('.contact-form');
        var $orderForm = $('.order-form');
        
        $inputPhone.mask("+7 (999) 999-99-99");  //init mask
        $contactForm.formController({
            submitSelector: '.btn[type="submit"]'
        });
        $orderForm.formController({
            submitSelector: '.btn[type="submit"]'
        });
    })();
    
    /*ScrollUp button controller (self init)*/
    (function(){
        function ScrollTop(tmpl) {
            this._tmpl = tmpl || '<div id="scrollUp"><i class="upButton"></i></div>';
            this._isActive = false;
            
            this.init();
        }
        ScrollTop.prototype.init = function () {
            this._$btn = $(this._tmpl);
            $('body').append(this._$btn);
            
            this.scrollBtnToggler();
            
            this._$btn.on('click', this.scrollTop.bind(this));
            $(window).on('scroll', this.scrollBtnToggler.bind(this));
        };
        ScrollTop.prototype.scrollBtnToggler = function () {
            if ( $(document).scrollTop() > $(window).height() && !this._isActive ) {
                this._$btn.fadeIn({queue : false, duration: 400})
                    .animate({'bottom' : '40px'}, 400);
                this._isActive = true;
            } else if ( $(document).scrollTop() < $(window).height() && this._isActive ) {
                this._$btn.fadeOut({queue : false, duration: 400})
                    .animate({'bottom' : '-20px'}, 400);
                this._isActive = false;
            }
        };
        ScrollTop.prototype.scrollTop = function(){
            $("html, body").animate({scrollTop: 0}, 500);
            return false;
        };
        
        var scrollTopBtn = new ScrollTop();
    })();
    
    /*mmenu*/
    (function(){
        var $menu = $('nav#m-menu');
        var $openMenuBtn = $('#hamburger');
    
        $menu.mmenu();
        var api = $menu.data( 'mmenu' );
        
        $openMenuBtn.on('click', api.open);
    })();
    
    /*fixed menu*/
    (function(){
        var $topMenu = $('[data-component="fixedMenu"]');
        var $mobileHeader = $('[data-component="fixedMenuMobile"]');
        
        $topMenu.fixedMenu({
            pageSearch: false
        });
        $mobileHeader.fixedMenu({
            fixedClass: 'js-top-fixed-mobile',
            pageSearch: false
        });
    })();
    
    
});