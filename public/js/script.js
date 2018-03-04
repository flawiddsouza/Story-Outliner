$(document).ready(function() {
    $(".clickable-row").click(function() {
        window.document.location = $(this).data("href");
    });

    // handle confirm deletion
    $('button.confirm-delete').on('click', function(e) {
        var form = $(this).closest('form');
        e.stopPropagation(); // to prevent clickable-row from catching the click if the clicked button is inside its domain
        e.preventDefault();
        $('#confirm-delete').modal()
        .one('click', '#delete', function (e) {
            form.trigger('submit');
        });
    });

    // handle .edit-content
    var count = 0;
    $('body').on('click', function(e){
        if($(e.target).hasClass('edit-content'))
        {
            var value_before_click = $(e.target).html()
                .replace(/<br\s*[\/]?>/gi, "\n").trim(); // replace <br/> with line breaks + you need trim() to avoid extra space at the end
            if(count < 1)
            {
                $(e.target).html('<textarea></textarea>');
                $(e.target).find('textarea').focus()
                $(e.target).find('textarea').val(value_before_click); // to get the cursor at the end of the text
                $(e.target).find('textarea').flexible();
                count++;
            }
            $(e.target).focusout(function() {
                var value_after_click = $(e.target).find('textarea').val()
                    .replace(/(?:\r\n|\r|\n)/g, '<br />').trim(); // replace lines breaks with <br /> + you need trim() to avoid extra space at the end
                $(e.target).html(value_after_click);
                // if the value you want to send is not equal to the value that was already there then...
                if(value_after_click != value_before_click) // this check works perfectly only once after the first change in value, starts acting weird after that
                {
                    var name = $(e.target).data('name'),
                        url = $(e.target).data('url');
                    var inputs = {};
                    inputs[name] = value_after_click;
                    
                    ajaxHelper(inputs, url, "POST"); // express has some issues with PUT for some reason
                }
                count = 0;
            });
        }
    });

    // handle .quick-edit (so DRY)
    $('.quick-edit').on('click', function(e) {
        e.stopPropagation();

        var button = $(this) // Button that triggered the modal

        var data = button.data(); // get an object of all the data attributes assigned to this element
        var keys = Object.keys(data); // array of keys
        var newKeys = [];
        keys.forEach(function(key) {
            newKeys.push(key.toUnderscore()) // convert all keys from camelCase to under_score data-setting-name -> settingName -> setting_name
        });
        var values = Object.values(data) // array of values
        var newData = newKeys.toObj(values); // new object with a new set of keys and old values

        newKeys.forEach(function(key) {
            this[key] = newData[key]; // create a variable for each key and assign object[key] value as it's value
        });

        var modal = $(target);
        modal.find('form').attr('action', url);

        newKeys.pop(); // removes target from the key list
        newKeys.pop(); // removes url from the key list

        newKeys.forEach(function(key) {
            modal.find("input[name='"+key+"']").val(this[key]);
        });

        $(target).modal(); // show modal
    });

    // clear modal form on close
    $('.modal').on('hidden.bs.modal', function(){
        $(this).find('form')[0].reset();
    });

    // focus cursor into the very first input in the modal when its shown
    $('.modal').on('shown.bs.modal', function () {
        $('input:first', this).focus();
    });

    // Add Classes
    $('.table').addClass('table-hover');
    if($('table > tbody > tr > td').hasClass('text-center'))
        $('.table').toggleClass('table-hover');
});


// -------------------------
// Helpers
// -------------------------

function ajaxHelper(inputs, url, method) {
    $.ajax({
        method: method,
        url: url,
        data: inputs
    })
    .done(function() {
        console.log("success");
    })
    .fail(function() {
        console.log("error");
    });
}

Object.values = obj => Object.keys(obj).map(key => obj[key]);

Array.prototype.toObj = function(values){
    values = values || this.map(function(v){return true;}); 
    var some;
    this .map(function(v){return [v,this.shift()]},values)
        .map(function(v){this[v[0]]=v[1];},some = {});
    return some; 
};

String.prototype.toUnderscore = function(){
    return this.replace(/([A-Z])/g, function($1){return "_"+$1.toLowerCase();});
};