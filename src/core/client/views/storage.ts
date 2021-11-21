import * as alt from 'alt-client';
import { View_Events_Storage } from '../../shared/enums/Views';
import { Item } from '../../shared/interfaces/Item';
import { WebViewController } from '../extensions/view2';
import ViewModel from '../models/ViewModel';
import { isAnyMenuOpen } from '../utility/menus';
import { BaseHUD } from './hud/hud';

const PAGE_NAME = 'Storage';

let name: string;
let id: string;
let storage: Item[];
let inventory: Array<Array<Item>>;

class StorageView implements ViewModel {
    static async show(_id: string, _name: string, _storage: Item[], _inventory: Array<Array<Item>>): Promise<void> {
        id = _id;
        name = _name;
        storage = _storage;
        inventory = _inventory;

        if (isAnyMenuOpen()) {
            return;
        }

        const view = await WebViewController.get();
        view.on(`${PAGE_NAME}:Ready`, StorageView.refresh);
        view.on(`${PAGE_NAME}:Close`, StorageView.close);
        view.on(`${PAGE_NAME}:MoveFromPlayer`, StorageView.moveFromPlayer);
        view.on(`${PAGE_NAME}:MoveFromStorage`, StorageView.moveFromStorage);
        WebViewController.openPages([PAGE_NAME]);
        WebViewController.focus();
        WebViewController.showCursor(true);
        alt.toggleGameControls(false);
        alt.Player.local.isMenuOpen = true;
        BaseHUD.setHudVisibility(false);
    }

    static async close() {
        alt.toggleGameControls(true);
        BaseHUD.setHudVisibility(true);
        alt.emitServer(View_Events_Storage.Close);

        id = null;
        name = null;
        storage = null;
        inventory = null;

        const view = await WebViewController.get();
        view.off(`${PAGE_NAME}:Ready`, StorageView.refresh);
        view.off(`${PAGE_NAME}:Close`, StorageView.close);
        view.off(`${PAGE_NAME}:MoveFromPlayer`, StorageView.moveFromPlayer);
        view.off(`${PAGE_NAME}:MoveFromStorage`, StorageView.moveFromStorage);

        WebViewController.closePages([PAGE_NAME]);
        WebViewController.unfocus();
        WebViewController.showCursor(false);

        alt.Player.local.isMenuOpen = false;
    }

    static async refresh(_inventory: Array<Array<Item>>, _storage: Item[]) {
        if (_storage) {
            storage = _storage;
        }

        if (_inventory) {
            inventory = _inventory;
        }

        const view = await WebViewController.get();
        view.emit(`${PAGE_NAME}:SetName`, name);
        view.emit(`${PAGE_NAME}:SetStorage`, storage);
        view.emit(`${PAGE_NAME}:SetInventory`, inventory);
    }

    static moveFromStorage(index: number, amount: number) {
        alt.emitServer(View_Events_Storage.MoveFromStorage, id, index, amount);
    }

    static moveFromPlayer(index: number, amount: number) {
        alt.emitServer(View_Events_Storage.MoveFromPlayer, id, index, amount);
    }
}

alt.onServer(View_Events_Storage.Open, StorageView.show);
alt.onServer(View_Events_Storage.Close, StorageView.close);
alt.onServer(View_Events_Storage.Refresh, StorageView.refresh);
