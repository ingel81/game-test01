const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.ts',
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif|wav|mp3|ogg)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[name][ext]',
        },
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.html',
      filename: 'index.html',
      inject: true,
    }),
    new CopyWebpackPlugin({
      patterns: [
        { 
          from: 'assets',
          to: 'assets',
          globOptions: {
            ignore: ['**/*.DS_Store', '**/*.map'],
          },
          noErrorOnMissing: true,
        }
      ],
    }),
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          format: {
            comments: false,
          },
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log']
          },
        },
        extractComments: false,
      }),
    ],
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
  performance: {
    maxEntrypointSize: 2048000,
    maxAssetSize: 2048000
  },
  devServer: {
    static: [
      {
        directory: path.join(__dirname, 'dist'),
      },
      {
        directory: path.join(__dirname),
      }
    ],
    compress: true,
    port: 3001,
    hot: 'only',
    watchFiles: {
      paths: ['src/**/*', 'assets/**/*', 'index.html'],
      options: {
        ignored: /node_modules/,
      },
    },
  },
  devtool: 'eval-source-map',
  mode: 'development',
  stats: {
    assets: true,
    colors: true,
    modules: false,
  }
}; 