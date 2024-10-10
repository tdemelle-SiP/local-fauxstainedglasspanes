<?php
define( 'WP_CACHE', false ); // Added by WP Rocket

/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the installation.
 * You don't have to use the web site, you can copy this file to "wp-config.php"
 * and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * Database settings
 * * Secret keys
 * * Database table prefix
 * * Localized language
 * * ABSPATH
 *
 * @link https://wordpress.org/support/article/editing-wp-config-php/
 *
 * @package WordPress
 */

// ** Database settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'local' );

/** Database username */
define( 'DB_USER', 'root' );

/** Database password */
define( 'DB_PASSWORD', 'root' );

/** Database hostname */
define( 'DB_HOST', 'localhost' );

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',          '{j!Ogc}MnAVb>-pb7|bLg)kG;@-&Q +~Yrv.bU;EE(KCJ1d2MQkpUfOq<D^x&#we' );
define( 'SECURE_AUTH_KEY',   'M;rSWZV[KBbw$t4^e#bEMKe+2Di7GU/v&$3UQ::;dar/pxJe~vdIFRUl+ttYPt=Z' );
define( 'LOGGED_IN_KEY',     'cb6`07}lQlycF$=7uZDD,:Z=UBBD}Ok&r,bN/11VXFp&W#;/}h&2PK?m8X.iu/K#' );
define( 'NONCE_KEY',         '<1@$&&n%_U9iNZicZ_YI%MFu:z!T?hLM^DLg9/Jvll^FvFn:v(MdfP}Cm ]lW86]' );
define( 'AUTH_SALT',         'a&|;#UN,(O Rd-iVcGSo;nn7/<4eY%YDm~rb?H`Sbz1tZt{s^yoS.XceX~d1hQ^]' );
define( 'SECURE_AUTH_SALT',  ';jt:_db9sVz.@eP~/EeV:}{%dG=t[Cp?p{Av!z2,23S70slRbUNoDj8&X;7z0`fm' );
define( 'LOGGED_IN_SALT',    'l^2!e20.Rsm?HiEX4WsPF<&->6+6Q}6p_}|{;`JnsS@0c$nf!P.cRUP9Wnt~eb~P' );
define( 'NONCE_SALT',        'g|<|JC]=6E?zvQG[u}b)RIoY/bx-%3S=WMyqx#tj}TeD>9Kbbu6#-[O{Ht=@wdvm' );
define( 'WP_CACHE_KEY_SALT', 'wn}4a]hQLvqqWdL$o3`#QQ~3+n,~JR8,M}J4+g}$923~o(@YBl][}>x%}@@Xw=M_' );


/**#@-*/

/**
 * WordPress database table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix = 'wp_';


/* Add any custom values between this line and the "stop editing" line. */



/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://wordpress.org/support/article/debugging-in-wordpress/
 */
 error_reporting(E_ALL);
 ini_set('display_errors', 1);
 define('WP_DEBUG', true);
 define( 'WP_DEBUG_LOG', true );

// if ( ! defined( 'WP_DEBUG' ) ) {
// 	define( 'WP_DEBUG', false );
// }

define( 'WP_ENVIRONMENT_TYPE', 'local' );
/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
