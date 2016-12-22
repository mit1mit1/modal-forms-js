function register_modal_actions(modal)
{
    if (typeof register_modal_events == 'function') { 
        register_modal_events(); 
    }

    modal.find('.modal-form-submit').on({
        'click': function() {


            var jq_this = $(this);
            var button_html = jq_this.html();
            jq_this.prepend('<i class="uk-icon-spinner uk-icon-spin"></i> ')

            var modal = jq_this.closest('.uk-modal');

            $.when(modal.trigger('modal-form-submit')).done(function() {

                var modal_form = modal.find('form').first();
                var target_url = modal_form.attr('action');
                var target_method = modal_form.attr('method') || 'POST';
                var form_data = modal_form.find('input, select, button, textarea').not('.tinymce-editor').serializeArray();
                $('.tinymce-editor').each(function() {
                    id = $(this).attr('id');
                    editor = tinymce.get($(this).attr('id'));
                    if (editor) {
                        form_data.push({
                            'name' : id,
                            'value' : editor.getContent()
                        });
                    }
                });
                var reload_on_success = modal.attr('data-reload-on-success') || false;
                var target_div = modal.find('.modal-form-content');

                $.ajax({
                    method: target_method,
                    url: target_url,
                    data: form_data
                }).done(function(content) {

                    if (typeof on_modal_form_submit == 'function') {
                        on_modal_form_submit(content);
                    }

                    if (content == 'success' || content.success == "success") {
                        jq_this.html(button_html);
                        if (content.redirect) {
                            window.location.assign(content.redirect);
                        } else if (reload_on_success) {
                            location.reload();
                        } else {
                            UIkit.notify("Form saved", {pos:'top-right', status: 'success'});
                            UIkit.modal(modal).hide();
                        }
                    } else {
                        target_div.html(content);
                    }

                }).fail(function( jqXHR, textStatus ) {
                    jq_this.html(button_html);

                    // Handle Validation Errors
                    if (jqXHR.status == 422) {
                        // Clear previous errors
                        $('.error-messages').remove();
                        $('.uk-form-danger').removeClass('uk-form-danger');

                        // Add new error messages
                        $('.modal-form-content').prepend("<div class='error-messages uk-alert uk-alert-danger'></div>");
                        var error_fields = jqXHR.responseJSON;

                        if (error_fields) {
                            for (var field in error_fields) {
                                for (var index in error_fields[field]) {
                                    $('.error-messages').append("<div class='error-line'>" + error_fields[field][index] + "</div>")
                                    $('[name=' + field + ']').addClass('uk-form-danger');
                                }
                            }                        
                        } else {
                            alert("Validation Error");
                        }
                    } else {
                        alert( "Request failed: " + textStatus + jqXHR.statusCode());
                    }

                });
            });

            // Prevent default
            return false;
        }
    });

    modal.find('.modal-form-delete').on({

        'click': function() {


            var jq_this = $(this);

            UIkit.modal.confirm("Are you sure you want to delete?", function(){

                var button_html = jq_this.html();
                jq_this.prepend('<i class="uk-icon-spinner uk-icon-spin"></i> ')

                var modal = jq_this.closest('.uk-modal');
                
                $.when(modal.trigger('modal-form-delete')).done(function() {

                    var modal_form = modal.find('form').first();
                    var target_url = modal_form.attr('data-delete-url');
                    var target_method = 'DELETE';
                    var reload_on_success = modal.attr('data-reload-on-success') || false;

                    var target_div = modal.find('.modal-form-content');

                    $.ajax({
                        method: target_method,
                        url: target_url
                    }).done(function(content) {

                        if (typeof on_modal_form_delete == 'function') {
                            on_modal_form_delete(content);
                        }

                        if (content == 'success' || content.success == "success") {
                            if (content.redirect) {
                                window.location.assign(content.redirect);
                            } else if (reload_on_success) {
                                location.reload();
                            } else {
                                UIkit.notify("Item Deleted", {pos:'top-right', status: 'success'});
                                UIkit.modal(modal).hide();
                            }
                        } else {
                            // Restore button html
                            jq_this.html(button_html);
                            target_div.html(content);
                        }

                    }).fail(function( jqXHR, textStatus ) {
                        jq_this.html(button_html);
                        alert( "Request failed: " + textStatus );
                    });
                });
            });

            // Prevent default
            return false;
        }
    });


    // Unsaved check
    modal.find(":input[type!=filtering]").change(function () {
        window.unsaved = true;
    });

    modal.find('.modal-form-submit,.modal-form-delete,.uk-modal-close').click(function() {
        window.unsaved = false;
    });

    window.onbeforeunload = (function () {
        if (window.unsaved) {
            return "You have unsaved changes on this page.";
        }
    });
}

function register_modal_links()
{
    $('[data-uk-modal][data-form-url]').off('click');
    $('[data-uk-modal][data-form-url]').on({
        'click': function() {
            
            // Load the form
            var form_url = $(this).attr('data-form-url');
            var modal_selector = $(this).attr('href');
            var modal = $(modal_selector);

            var target_div = modal.find('.modal-form-content');
            target_div.html("<div class='uk-modal-spinner'></div>");

            $.ajax({
                method: "GET",
                url: form_url
            }).done(function(content) {
                target_div.html(content);

                register_modal_actions(modal);

                modal.trigger('modal-form-open');

            }).fail(function( jqXHR, textStatus ) {
                UIkit.modal(modal).hide();
                alert( "Request failed: " + textStatus );
            });
        }
    });
}

$(document).ready(function() {
    register_modal_links();
});