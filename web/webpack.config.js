import path from 'path';
import TerserPlugin from 'terser-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CssMinimizerPlugin from "css-minimizer-webpack-plugin";

export default {
    entry: {
        index: './src/js/index.js',
        dashboard: './src/js/dashboard.js',
    },
    output: {
        filename: 'js/[name].min.js',
        path: path.resolve(import.meta.dirname, './public/'),
    },
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                extractComments: false,
                terserOptions: {
                    format: {
                        comments: false,
                    },
                    mangle: true,
                },
            }),
            new CssMinimizerPlugin({
                minimizerOptions: {
                    preset: [
                        "default",
                        {
                            discardComments: { removeAll: true },
                        },
                    ],
                },
            }),
        ],
    },
    module: {
        rules: [
            {
                test: /\.less$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'less-loader',
                ],
            },
            {
                test: /\.(png|jpg|webp)$/i,
                type: 'asset/resource',
                generator: {
                    filename: 'img/generated/[hash][ext][query]'
                }
            }
        ],
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'css/[name].min.css',
        }),
    ],
    watch: true,
    // devtool: process.env.NODE_ENV === 'production' ? false : 'eval-cheap-module-source-map',
    devtool: process.env.NODE_ENV === 'production' ? false : 'source-map',
};
