( async () => {
    for(let item of game.items) {
        await Item.delete(item._id);
    }
    game.items.directory.render();
    for(let actor of game.actors) {
        for(let item of actor.items) {
            await actor.removeItemFromInventory(item._id);
        }
    }
    const compendiums = ['credentials', 'investigativeAbilities-srd', 'generalAbilities-srd'];
    const createSubfolders = async (parent, kind) => {
        return null;
    }
    const chooseFolder = (item, kind, parent, subfolders) => {
        return parent;
    };
    const allItemFolders = game.folders.filter(f => f.data.type === 'Item');
    for(let i = 0; i < allItemFolders.length; i++) {
        let folder = allItemFolders[i];
        if(compendiums.includes(folder.name.toLowerCase())) {
            await Folder.delete(folder._id);
        }
    }
    for(let i = 0; i < compendiums.length; i++) {
        const kind = compendiums[i];
        const folder = await Folder.create({type: "Item", parent: null, name: (kind[0].toUpperCase() + kind.slice(1))})
        const subfolders = await createSubfolders(folder, kind);
        const pack = game.packs.find(p => p.collection === `gumshoe.${kind}`);
        await pack.configure({locked: false});
        const existingContent = await pack.getContent();
        for(const entry of existingContent) {
            await pack.deleteEntity(entry._id);
        }
        const response = await fetch(`systems/gumshoe/compendium-src/${kind}.json`);
        const content = await response.json();
        const created = await Item.create(content.entries, {temporary: true});
        if(created.data) {
            const entity = await pack.importEntity(created);
            console.log(`Imported Item ${created.name} into Compendium pack ${pack.collection}`);
            let importedItem = await game.items.importFromCollection(`gumshoe.${kind}`, entity._id);
            await importedItem.update({
                folder: chooseFolder(importedItem, kind, folder, subfolders)._id,
                permission: {
                    default: 2,
                },
            });
        } else {
            for ( let i of created ) {
                const entity = await pack.importEntity(i);
                console.log(`Imported Item ${i.name} into Compendium pack ${pack.collection}`);
                let importedItem = await game.items.importFromCollection(`gumshoe.${kind}`, entity._id);
                await importedItem.update({
                    folder: chooseFolder(importedItem, kind, folder, subfolders)._id,
                    permission: {
                        default: 2,
                    },
                });
            }
        }
        await pack.configure({locked: true});
    }
    game.items.directory.render();
})()