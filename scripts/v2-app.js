$(document).ready(function() {

    // Communities menu
    //
    $('#menu-item-communities').mouseenter(function() {

        $('#menu-communities').show(); 
        $('#menu-item-communities').addClass('selected');
    });

    $('#menu-item-communities').mouseleave(function() {

        $('#menu-communities').hide(); 
        $('#menu-item-communities').removeClass('selected');
    });

    // Search icon in header
    //
    $('.fa-search').click(function() {
        $('html, body').animate({
            scrollTop: 0
        }, 
        400);
    });
});