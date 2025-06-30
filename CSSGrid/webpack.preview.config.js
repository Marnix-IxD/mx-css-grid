const path = require("path");

module.exports = {
    mode: "production",
    entry: {
        "CSSGrid.editorPreview": "./src/CSSGrid.editorPreview.tsx",
        "CSSGrid.editorConfig": "./src/CSSGrid.editorConfig.ts"
    },
    output: {
        path: path.resolve(__dirname, "./src"),
        filename: "[name].js",
        libraryTarget: "commonjs2"
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx"]
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: {
                    loader: "ts-loader",
                    options: {
                        configFile: "tsconfig.preview.json",
                        transpileOnly: true
                    }
                },
                exclude: /node_modules/
            }
        ]
    },
    externals: {
        "react": "react",
        "react-dom": "react-dom"
    },
    optimization: {
        minimize: false
    }
};