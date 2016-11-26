/**
 * Created by user on 26.11.2016.
 */
/*
* слайдер
* меню
* фикс меню
* фенсибокс
* валидация
* */

$(document).ready(function () {
    /*slider*/
    (function(){
    	var $mainPageHeaderSlider = $('.pageheader__slider');
        var $workProcessSlider = $('.work-process__slider');
        
        $mainPageHeaderSlider.slick({
            fade: true
        });
        $workProcessSlider.slick({
            fade: true
        });
    })();
    
    /*fancybox*/
    (function(){
    	$lightbox = $('[data-component="fancybox"]');
        
        $lightbox.fancybox();
    })();
    
    
    
});