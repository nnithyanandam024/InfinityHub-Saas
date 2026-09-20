import { mockStore } from '../data/mockStore';
import type {
  RestaurantSection,
  RestaurantTable,
  RestaurantMenuItem,
  RestaurantKot,
  RestaurantOrder,
  RestaurantRecipe,
  RestaurantWasteLog,
  TableTransferAudit,
  KotItemStatus
} from '@infinityhub/types';

export const restaurantService = {
  async getSections(tenantId: string): Promise<RestaurantSection[]> {
    return mockStore.getRestaurantSections(tenantId);
  },

  async getTables(tenantId: string): Promise<RestaurantTable[]> {
    return mockStore.getRestaurantTables(tenantId);
  },

  async getMenuItems(tenantId: string): Promise<RestaurantMenuItem[]> {
    return mockStore.getRestaurantMenuItems(tenantId);
  },

  async getKots(tenantId: string): Promise<RestaurantKot[]> {
    return mockStore.getRestaurantKots(tenantId);
  },

  async getOrders(tenantId: string): Promise<RestaurantOrder[]> {
    return mockStore.getRestaurantOrders(tenantId);
  },

  async getRecipes(tenantId: string): Promise<RestaurantRecipe[]> {
    return mockStore.getRestaurantRecipes(tenantId);
  },

  async getWasteLogs(tenantId: string): Promise<RestaurantWasteLog[]> {
    return mockStore.getRestaurantWasteLogs(tenantId);
  },

  async getTableAudits(tenantId: string): Promise<TableTransferAudit[]> {
    return mockStore.getTableAudits(tenantId);
  },

  async seatTable(
    tenantId: string,
    tableId: string,
    guestCount: number,
    captainName: string
  ): Promise<RestaurantTable> {
    return mockStore.seatTable(tenantId, tableId, guestCount, captainName);
  },

  async fireKot(
    tenantId: string,
    tableId: string,
    items: Array<{
      menuItemId: string;
      name: string;
      quantity: number;
      unitPrice: number;
      station: 'kitchen' | 'tandoor' | 'bar' | 'dessert' | 'pantry';
      selectedModifiers?: any[];
      specialNotes?: string;
    }>,
    captainName: string
  ): Promise<{ kot: RestaurantKot; table: RestaurantTable }> {
    return mockStore.fireKot(tenantId, tableId, items, captainName);
  },

  async updateKotItemStatus(
    tenantId: string,
    kotId: string,
    itemId: string,
    status: KotItemStatus
  ): Promise<RestaurantKot> {
    return mockStore.updateKotItemStatus(tenantId, kotId, itemId, status);
  },

  async bumpKot(tenantId: string, kotId: string): Promise<RestaurantKot> {
    return mockStore.bumpKot(tenantId, kotId);
  },

  async voidKotItem(
    tenantId: string,
    kotId: string,
    itemId: string,
    reason: string,
    managerPin: string,
    authorizedBy?: string
  ): Promise<{ kot: RestaurantKot; wasteLog: RestaurantWasteLog }> {
    return mockStore.voidKotItem(tenantId, kotId, itemId, reason, managerPin, authorizedBy);
  },

  async transferTable(
    tenantId: string,
    sourceTableId: string,
    targetTableId: string,
    reason: string,
    managerPin: string,
    transferredBy?: string
  ): Promise<TableTransferAudit> {
    return mockStore.transferTable(tenantId, sourceTableId, targetTableId, reason, managerPin, transferredBy);
  },

  async printGuestCheck(
    tenantId: string,
    tableId: string,
    reprintedBy?: string,
    reprintReason?: string
  ): Promise<{ order: RestaurantOrder; isDuplicate: boolean; printCount: number }> {
    return mockStore.printGuestCheck(tenantId, tableId, reprintedBy, reprintReason);
  },

  async settleTableBill(
    tenantId: string,
    tableId: string,
    payload: {
      payments: Array<{ method: 'cash' | 'upi' | 'card' | 'credit_khata' | 'split'; amount: number; reference?: string }>;
      customerName?: string;
      customerPhone?: string;
      serviceChargePercentage?: number;
      discountAmount?: number;
    }
  ): Promise<{ order: RestaurantOrder; table: RestaurantTable }> {
    return mockStore.settleTableBill(tenantId, tableId, payload);
  },

  async resetTableToVacant(tenantId: string, tableId: string): Promise<RestaurantTable> {
    return mockStore.resetTableToVacant(tenantId, tableId);
  },

  async saveRecipe(tenantId: string, recipe: RestaurantRecipe): Promise<RestaurantRecipe> {
    return mockStore.saveRecipe(tenantId, recipe);
  },

  async createSection(tenantId: string, payload: any): Promise<RestaurantSection> {
    return mockStore.createRestaurantSection(tenantId, payload);
  },

  async updateSection(tenantId: string, sectionId: string, payload: any): Promise<RestaurantSection> {
    return mockStore.updateRestaurantSection(tenantId, sectionId, payload);
  },

  async deleteSection(tenantId: string, sectionId: string): Promise<void> {
    return mockStore.deleteRestaurantSection(tenantId, sectionId);
  },

  async createTable(tenantId: string, payload: any): Promise<RestaurantTable> {
    return mockStore.createRestaurantTable(tenantId, payload);
  },

  async updateTable(tenantId: string, tableId: string, payload: any): Promise<RestaurantTable> {
    return mockStore.updateRestaurantTable(tenantId, tableId, payload);
  },

  async deleteTable(tenantId: string, tableId: string): Promise<void> {
    return mockStore.deleteRestaurantTable(tenantId, tableId);
  },

  async batchCreateTables(tenantId: string, payload: any): Promise<RestaurantTable[]> {
    return mockStore.batchCreateRestaurantTables(tenantId, payload);
  },

  async createMenuItem(tenantId: string, payload: any): Promise<RestaurantMenuItem> {
    return mockStore.createRestaurantMenuItem(tenantId, payload);
  },

  async updateMenuItem(tenantId: string, itemId: string, payload: any): Promise<RestaurantMenuItem> {
    return mockStore.updateRestaurantMenuItem(tenantId, itemId, payload);
  },

  async deleteMenuItem(tenantId: string, itemId: string): Promise<void> {
    return mockStore.deleteRestaurantMenuItem(tenantId, itemId);
  },

  async toggleMenuItemAvailability(tenantId: string, itemId: string): Promise<RestaurantMenuItem> {
    return mockStore.toggleMenuItemAvailability(tenantId, itemId);
  },

  async deleteRecipe(tenantId: string, recipeId: string): Promise<void> {
    return mockStore.deleteRestaurantRecipe(tenantId, recipeId);
  }
};
