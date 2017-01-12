cp src/config/environment.prod.ts src/config/environment.ts
npm run clean
ionic build browser --release
npm build --prod
npm run minify
cp src/config/environment.dev.ts src/config/environment.ts
cd www
sed -i .bak 's#base href=""#base href="/a"#g' index.html
sed -i .bak 's#link href="#link href="./a/#g' index.html
sed -i .bak 's#src="#src="./a/#g' index.html
cd ..
