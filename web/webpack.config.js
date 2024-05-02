const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

module.exports = {
    entry: {
        index: './src/js/index.js',
    },
    output: {
        filename: 'js/[name].min.js',
        path: path.resolve(__dirname, './public/'),
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
    devtool: process.env.NODE_ENV === 'production' ? false : 'eval-cheap-module-source-map',
};
