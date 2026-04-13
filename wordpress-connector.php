<?php
/**
 * Plugin Name: WP Connector API
 * Description: Endpoints REST para criar categorias, páginas, templates reutilizáveis e instalar plugins/temas do diretório oficial.
 * Version: 0.1.0
 * Author: Equipe de Automação
 */

if (!defined('ABSPATH')) {
    exit;
}

class WP_Connector_API {
    const NAMESPACE = 'wp-connector/v1';
    const TEMPLATE_CPT = 'wp_reusable_template';

    public function __construct() {
        add_action('init', [$this, 'register_template_cpt']);
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_template_cpt() {
        register_post_type(self::TEMPLATE_CPT, [
            'labels' => [
                'name' => 'Templates Reutilizáveis',
                'singular_name' => 'Template Reutilizável',
            ],
            'public' => false,
            'show_ui' => true,
            'show_in_rest' => false,
            'supports' => ['title', 'editor', 'custom-fields'],
            'capability_type' => 'post',
        ]);
    }

    public function register_routes() {
        register_rest_route(self::NAMESPACE, '/categories', [
            'methods' => 'POST',
            'callback' => [$this, 'create_category'],
            'permission_callback' => [$this, 'admin_permission'],
        ]);

        register_rest_route(self::NAMESPACE, '/pages', [
            'methods' => 'POST',
            'callback' => [$this, 'create_page'],
            'permission_callback' => [$this, 'admin_permission'],
        ]);

        register_rest_route(self::NAMESPACE, '/templates', [
            [
                'methods' => 'POST',
                'callback' => [$this, 'create_template'],
                'permission_callback' => [$this, 'admin_permission'],
            ],
            [
                'methods' => 'GET',
                'callback' => [$this, 'list_templates'],
                'permission_callback' => [$this, 'admin_permission'],
            ],
        ]);

        register_rest_route(self::NAMESPACE, '/plugins/install', [
            'methods' => 'POST',
            'callback' => [$this, 'install_plugin'],
            'permission_callback' => [$this, 'admin_permission'],
        ]);

        register_rest_route(self::NAMESPACE, '/themes/install', [
            'methods' => 'POST',
            'callback' => [$this, 'install_theme'],
            'permission_callback' => [$this, 'admin_permission'],
        ]);
    }

    public function admin_permission() {
        return current_user_can('manage_options');
    }

    public function create_category(WP_REST_Request $request) {
        $name = sanitize_text_field($request->get_param('name'));
        $slug = sanitize_title($request->get_param('slug'));

        if (empty($name)) {
            return new WP_Error('missing_name', 'O campo name é obrigatório.', ['status' => 400]);
        }

        $result = wp_insert_term($name, 'category', [
            'slug' => $slug ?: null,
        ]);

        if (is_wp_error($result)) {
            return $result;
        }

        return new WP_REST_Response([
            'success' => true,
            'term_id' => $result['term_id'],
        ], 201);
    }

    public function create_page(WP_REST_Request $request) {
        $title = sanitize_text_field($request->get_param('title'));
        $content = wp_kses_post($request->get_param('content'));
        $status = sanitize_key($request->get_param('status') ?: 'draft');

        if (empty($title)) {
            return new WP_Error('missing_title', 'O campo title é obrigatório.', ['status' => 400]);
        }

        $page_id = wp_insert_post([
            'post_type' => 'page',
            'post_title' => $title,
            'post_content' => $content,
            'post_status' => in_array($status, ['draft', 'publish', 'private'], true) ? $status : 'draft',
        ], true);

        if (is_wp_error($page_id)) {
            return $page_id;
        }

        return new WP_REST_Response([
            'success' => true,
            'page_id' => $page_id,
            'link' => get_permalink($page_id),
        ], 201);
    }

    public function create_template(WP_REST_Request $request) {
        $title = sanitize_text_field($request->get_param('title'));
        $content = wp_kses_post($request->get_param('content'));
        $meta = $request->get_param('meta');

        if (empty($title) || empty($content)) {
            return new WP_Error('missing_fields', 'Campos title e content são obrigatórios.', ['status' => 400]);
        }

        $template_id = wp_insert_post([
            'post_type' => self::TEMPLATE_CPT,
            'post_title' => $title,
            'post_content' => $content,
            'post_status' => 'publish',
        ], true);

        if (is_wp_error($template_id)) {
            return $template_id;
        }

        if (is_array($meta)) {
            foreach ($meta as $key => $value) {
                update_post_meta($template_id, sanitize_key($key), sanitize_text_field((string) $value));
            }
        }

        return new WP_REST_Response([
            'success' => true,
            'template_id' => $template_id,
        ], 201);
    }

    public function list_templates() {
        $posts = get_posts([
            'post_type' => self::TEMPLATE_CPT,
            'post_status' => 'publish',
            'numberposts' => -1,
        ]);

        $items = array_map(function($post) {
            return [
                'id' => $post->ID,
                'title' => $post->post_title,
                'content' => $post->post_content,
            ];
        }, $posts);

        return new WP_REST_Response([
            'success' => true,
            'items' => $items,
        ]);
    }

    public function install_plugin(WP_REST_Request $request) {
        $slug = sanitize_key($request->get_param('slug'));
        if (empty($slug)) {
            return new WP_Error('missing_slug', 'O campo slug é obrigatório.', ['status' => 400]);
        }

        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/misc.php';
        require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
        require_once ABSPATH . 'wp-admin/includes/plugin-install.php';

        $api = plugins_api('plugin_information', [
            'slug' => $slug,
            'fields' => ['sections' => false],
        ]);

        if (is_wp_error($api) || empty($api->download_link)) {
            return new WP_Error('plugin_not_found', 'Plugin não encontrado no diretório oficial.', ['status' => 404]);
        }

        $skin = new Automatic_Upgrader_Skin();
        $upgrader = new Plugin_Upgrader($skin);
        $result = $upgrader->install($api->download_link);

        if (is_wp_error($result) || !$result) {
            return new WP_Error('plugin_install_failed', 'Falha ao instalar o plugin.', ['status' => 500]);
        }

        return new WP_REST_Response([
            'success' => true,
            'slug' => $slug,
            'message' => 'Plugin instalado com sucesso.',
        ], 201);
    }

    public function install_theme(WP_REST_Request $request) {
        $slug = sanitize_key($request->get_param('slug'));
        if (empty($slug)) {
            return new WP_Error('missing_slug', 'O campo slug é obrigatório.', ['status' => 400]);
        }

        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/misc.php';
        require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
        require_once ABSPATH . 'wp-admin/includes/theme-install.php';

        $api = themes_api('theme_information', [
            'slug' => $slug,
            'fields' => ['sections' => false],
        ]);

        if (is_wp_error($api) || empty($api->download_link)) {
            return new WP_Error('theme_not_found', 'Tema não encontrado no diretório oficial.', ['status' => 404]);
        }

        $skin = new Automatic_Upgrader_Skin();
        $upgrader = new Theme_Upgrader($skin);
        $result = $upgrader->install($api->download_link);

        if (is_wp_error($result) || !$result) {
            return new WP_Error('theme_install_failed', 'Falha ao instalar o tema.', ['status' => 500]);
        }

        return new WP_REST_Response([
            'success' => true,
            'slug' => $slug,
            'message' => 'Tema instalado com sucesso.',
        ], 201);
    }
}

new WP_Connector_API();
