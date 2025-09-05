import { SingletonClass } from "../../core/singletonClass";
import { gridCmpt } from "../ui/item/gridCmpt";

/**
 * 匹配方向枚举
 */
export enum MatchDirection {
    HORIZONTAL = 'horizontal',
    VERTICAL = 'vertical',
    CROSS = 'cross'
}

/**
 * 匹配结果接口
 */
export interface MatchResult {
    matches: MatchGroup[];
    hasMatches: boolean;
    totalScore: number;
}

/**
 * 匹配组接口
 */
export interface MatchGroup {
    elements: gridCmpt[];
    direction: MatchDirection;
    length: number;
    position: { row: number; col: number };
    matchType: MatchType;
}

/**
 * 匹配类型枚举
 */
export enum MatchType {
    THREE = 3,        // 三消
    FOUR = 4,         // 四消
    FIVE = 5,         // 五消
    L_SHAPE = 6,      // L型
    T_SHAPE = 7,      // T型
    CROSS_SHAPE = 8   // 十字型
}

/**
 * 全新的匹配引擎 - 完全原创实现
 * 使用创新的区域扫描算法和模式识别
 */
export class MatchEngine extends SingletonClass<MatchEngine> {
    private boardWidth: number = 9;
    private boardHeight: number = 9;
    
    protected async onInit(...args: any[]) {
        console.log('[MatchEngine] 新匹配引擎初始化完成');
    }

    /**
     * 设置棋盘尺寸
     */
    setBoardSize(width: number, height: number) {
        this.boardWidth = width;
        this.boardHeight = height;
    }

    /**
     * 主匹配检测函数 - 使用创新的多阶段扫描算法
     */
    findMatches(board: (gridCmpt | null)[][]): MatchResult {
        const matches: MatchGroup[] = [];
        const visited = this.createVisitedMatrix();
        
        // 第一阶段：扫描基础水平和垂直匹配
        this.scanBasicMatches(board, matches, visited);
        
        // 第二阶段：检测特殊形状匹配（L型、T型、十字型）
        this.scanSpecialShapes(board, matches, visited);
        
        // 第三阶段：合并重叠匹配区域
        const mergedMatches = this.mergeOverlappingMatches(matches);
        
        return {
            matches: mergedMatches,
            hasMatches: mergedMatches.length > 0,
            totalScore: this.calculateTotalScore(mergedMatches)
        };
    }

    /**
     * 创建访问标记矩阵
     */
    private createVisitedMatrix(): boolean[][] {
        const matrix: boolean[][] = [];
        for (let i = 0; i < this.boardHeight; i++) {
            matrix[i] = new Array(this.boardWidth).fill(false);
        }
        return matrix;
    }

    /**
     * 扫描基础匹配（三消、四消、五消）
     */
    private scanBasicMatches(board: (gridCmpt | null)[][], matches: MatchGroup[], visited: boolean[][]) {
        // 水平扫描
        for (let row = 0; row < this.boardHeight; row++) {
            this.scanHorizontalLine(board, row, matches, visited);
        }
        
        // 垂直扫描
        for (let col = 0; col < this.boardWidth; col++) {
            this.scanVerticalLine(board, col, matches, visited);
        }
    }

    /**
     * 扫描水平线匹配
     */
    private scanHorizontalLine(board: (gridCmpt | null)[][], row: number, matches: MatchGroup[], visited: boolean[][]) {
        let currentSequence: gridCmpt[] = [];
        let currentType = -1;
        
        for (let col = 0; col < this.boardWidth; col++) {
            const cell = board[row] && board[row][col];
            
            if (!cell || visited[row][col] || cell.getMoveState()) {
                if (currentSequence.length >= 3) {
                    this.addMatchGroup(matches, currentSequence, MatchDirection.HORIZONTAL, row, col - currentSequence.length);
                    this.markVisited(visited, currentSequence);
                }
                currentSequence = [];
                currentType = -1;
                continue;
            }
            
            const cellType = this.getCellType(cell);
            
            if (cellType === currentType) {
                currentSequence.push(cell);
            } else {
                if (currentSequence.length >= 3) {
                    this.addMatchGroup(matches, currentSequence, MatchDirection.HORIZONTAL, row, col - currentSequence.length);
                    this.markVisited(visited, currentSequence);
                }
                currentSequence = [cell];
                currentType = cellType;
            }
        }
        
        // 处理行末的序列
        if (currentSequence.length >= 3) {
            this.addMatchGroup(matches, currentSequence, MatchDirection.HORIZONTAL, row, this.boardWidth - currentSequence.length);
            this.markVisited(visited, currentSequence);
        }
    }

    /**
     * 扫描垂直线匹配
     */
    private scanVerticalLine(board: (gridCmpt | null)[][], col: number, matches: MatchGroup[], visited: boolean[][]) {
        let currentSequence: gridCmpt[] = [];
        let currentType = -1;
        
        for (let row = 0; row < this.boardHeight; row++) {
            const cell = board[row] && board[row][col];
            
            if (!cell || visited[row][col] || cell.getMoveState()) {
                if (currentSequence.length >= 3) {
                    this.addMatchGroup(matches, currentSequence, MatchDirection.VERTICAL, row - currentSequence.length, col);
                    this.markVisited(visited, currentSequence);
                }
                currentSequence = [];
                currentType = -1;
                continue;
            }
            
            const cellType = this.getCellType(cell);
            
            if (cellType === currentType) {
                currentSequence.push(cell);
            } else {
                if (currentSequence.length >= 3) {
                    this.addMatchGroup(matches, currentSequence, MatchDirection.VERTICAL, row - currentSequence.length, col);
                    this.markVisited(visited, currentSequence);
                }
                currentSequence = [cell];
                currentType = cellType;
            }
        }
        
        // 处理列末的序列
        if (currentSequence.length >= 3) {
            this.addMatchGroup(matches, currentSequence, MatchDirection.VERTICAL, this.boardHeight - currentSequence.length, col);
            this.markVisited(visited, currentSequence);
        }
    }

    /**
     * 扫描特殊形状匹配
     */
    private scanSpecialShapes(board: (gridCmpt | null)[][], matches: MatchGroup[], visited: boolean[][]) {
        for (let row = 0; row < this.boardHeight; row++) {
            for (let col = 0; col < this.boardWidth; col++) {
                const cell = board[row] && board[row][col];
                if (!cell || visited[row][col]) continue;
                
                // 检测L型匹配
                this.detectLShape(board, row, col, matches, visited);
                
                // 检测T型匹配
                this.detectTShape(board, row, col, matches, visited);
                
                // 检测十字型匹配
                this.detectCrossShape(board, row, col, matches, visited);
            }
        }
    }

    /**
     * 检测L型匹配
     */
    private detectLShape(board: (gridCmpt | null)[][], startRow: number, startCol: number, matches: MatchGroup[], visited: boolean[][]) {
        const centerCell = board[startRow] && board[startRow][startCol];
        if (!centerCell) return;
        
        const cellType = this.getCellType(centerCell);
        const lShapePatterns = [
            // 四种L型方向
            { horizontal: [0, 1, 2], vertical: [0, -1, -2] },
            { horizontal: [0, -1, -2], vertical: [0, -1, -2] },
            { horizontal: [0, 1, 2], vertical: [0, 1, 2] },
            { horizontal: [0, -1, -2], vertical: [0, 1, 2] }
        ];
        
        for (const pattern of lShapePatterns) {
            const matchingCells: gridCmpt[] = [];
            let isValidPattern = true;
            
            // 检查水平部分
            for (const hOffset of pattern.horizontal) {
                const col = startCol + hOffset;
                const cell = this.getCellAt(board, startRow, col);
                if (!cell || this.getCellType(cell) !== cellType || visited[startRow][col]) {
                    isValidPattern = false;
                    break;
                }
                matchingCells.push(cell);
            }
            
            // 检查垂直部分（除了中心点，避免重复）
            if (isValidPattern) {
                for (const vOffset of pattern.vertical) {
                    if (vOffset === 0) continue; // 跳过中心点
                    const row = startRow + vOffset;
                    const cell = this.getCellAt(board, row, startCol);
                    if (!cell || this.getCellType(cell) !== cellType || visited[row][startCol]) {
                        isValidPattern = false;
                        break;
                    }
                    matchingCells.push(cell);
                }
            }
            
            if (isValidPattern && matchingCells.length >= 5) {
                this.addMatchGroup(matches, matchingCells, MatchDirection.CROSS, startRow, startCol, MatchType.L_SHAPE);
                this.markVisited(visited, matchingCells);
                break;
            }
        }
    }

    /**
     * 检测T型匹配
     */
    private detectTShape(board: (gridCmpt | null)[][], startRow: number, startCol: number, matches: MatchGroup[], visited: boolean[][]) {
        const centerCell = board[startRow] && board[startRow][startCol];
        if (!centerCell) return;
        
        const cellType = this.getCellType(centerCell);
        const tShapePatterns = [
            // T型的四种方向
            { base: [[0, -1], [0, 0], [0, 1]], stem: [[-1, 0], [-2, 0]] },
            { base: [[0, -1], [0, 0], [0, 1]], stem: [[1, 0], [2, 0]] },
            { base: [[-1, 0], [0, 0], [1, 0]], stem: [[0, -1], [0, -2]] },
            { base: [[-1, 0], [0, 0], [1, 0]], stem: [[0, 1], [0, 2]] }
        ];
        
        for (const pattern of tShapePatterns) {
            const matchingCells: gridCmpt[] = [];
            let isValidPattern = true;
            
            // 检查T型底部
            for (const [rowOffset, colOffset] of pattern.base) {
                const row = startRow + rowOffset;
                const col = startCol + colOffset;
                const cell = this.getCellAt(board, row, col);
                if (!cell || this.getCellType(cell) !== cellType || visited[row][col]) {
                    isValidPattern = false;
                    break;
                }
                matchingCells.push(cell);
            }
            
            // 检查T型茎部
            if (isValidPattern) {
                for (const [rowOffset, colOffset] of pattern.stem) {
                    const row = startRow + rowOffset;
                    const col = startCol + colOffset;
                    const cell = this.getCellAt(board, row, col);
                    if (!cell || this.getCellType(cell) !== cellType || visited[row][col]) {
                        isValidPattern = false;
                        break;
                    }
                    matchingCells.push(cell);
                }
            }
            
            if (isValidPattern && matchingCells.length >= 5) {
                this.addMatchGroup(matches, matchingCells, MatchDirection.CROSS, startRow, startCol, MatchType.T_SHAPE);
                this.markVisited(visited, matchingCells);
                break;
            }
        }
    }

    /**
     * 检测十字型匹配
     */
    private detectCrossShape(board: (gridCmpt | null)[][], startRow: number, startCol: number, matches: MatchGroup[], visited: boolean[][]) {
        const centerCell = board[startRow] && board[startRow][startCol];
        if (!centerCell) return;
        
        const cellType = this.getCellType(centerCell);
        const matchingCells: gridCmpt[] = [centerCell];
        
        // 检查四个方向
        const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1] // 上、下、左、右
        ];
        
        let validDirections = 0;
        for (const [rowDir, colDir] of directions) {
            let hasMatch = false;
            for (let i = 1; i <= 2; i++) {
                const row = startRow + rowDir * i;
                const col = startCol + colDir * i;
                const cell = this.getCellAt(board, row, col);
                if (cell && this.getCellType(cell) === cellType && !visited[row][col]) {
                    matchingCells.push(cell);
                    hasMatch = true;
                } else {
                    break;
                }
            }
            if (hasMatch) validDirections++;
        }
        
        if (validDirections >= 2 && matchingCells.length >= 5) {
            this.addMatchGroup(matches, matchingCells, MatchDirection.CROSS, startRow, startCol, MatchType.CROSS_SHAPE);
            this.markVisited(visited, matchingCells);
        }
    }

    /**
     * 获取指定位置的单元格
     */
    private getCellAt(board: (gridCmpt | null)[][], row: number, col: number): gridCmpt | null {
        if (row < 0 || row >= this.boardHeight || col < 0 || col >= this.boardWidth) {
            return null;
        }
        return board[row] && board[row][col];
    }

    /**
     * 获取单元格类型
     */
    private getCellType(cell: gridCmpt): number {
        return cell.type < 8 ? cell.type : -1; // 特效元素不参与普通匹配
    }

    /**
     * 添加匹配组
     */
    private addMatchGroup(matches: MatchGroup[], elements: gridCmpt[], direction: MatchDirection, row: number, col: number, matchType?: MatchType) {
        if (elements.length < 3) return;
        
        const group: MatchGroup = {
            elements: [...elements],
            direction,
            length: elements.length,
            position: { row, col },
            matchType: matchType || this.determineMatchType(elements.length, direction)
        };
        
        matches.push(group);
    }

    /**
     * 确定匹配类型
     */
    private determineMatchType(length: number, direction: MatchDirection): MatchType {
        if (direction === MatchDirection.CROSS) {
            return MatchType.CROSS_SHAPE;
        }
        
        switch (length) {
            case 3: return MatchType.THREE;
            case 4: return MatchType.FOUR;
            case 5: return MatchType.FIVE;
            default: return MatchType.FIVE;
        }
    }

    /**
     * 标记访问过的单元格
     */
    private markVisited(visited: boolean[][], elements: gridCmpt[]) {
        for (const element of elements) {
            if (element.data) {
                visited[element.data.v][element.data.h] = true;
            }
        }
    }

    /**
     * 合并重叠的匹配组
     */
    private mergeOverlappingMatches(matches: MatchGroup[]): MatchGroup[] {
        // 简化版本：直接返回，避免复杂的合并逻辑
        // 实际项目中可以实现更复杂的合并算法
        return matches;
    }

    /**
     * 计算总分数
     */
    private calculateTotalScore(matches: MatchGroup[]): number {
        let totalScore = 0;
        for (const match of matches) {
            const baseScore = match.length * 100;
            const typeMultiplier = this.getMatchTypeMultiplier(match.matchType);
            totalScore += baseScore * typeMultiplier;
        }
        return totalScore;
    }

    /**
     * 获取匹配类型分数倍数
     */
    private getMatchTypeMultiplier(matchType: MatchType): number {
        switch (matchType) {
            case MatchType.THREE: return 1;
            case MatchType.FOUR: return 2;
            case MatchType.FIVE: return 4;
            case MatchType.L_SHAPE: return 3;
            case MatchType.T_SHAPE: return 3;
            case MatchType.CROSS_SHAPE: return 5;
            default: return 1;
        }
    }

    /**
     * 检查两个元素交换后是否能形成匹配
     */
    canFormMatchAfterSwap(board: (gridCmpt | null)[][], pos1: {row: number, col: number}, pos2: {row: number, col: number}): boolean {
        // 模拟交换
        const temp = board[pos1.row][pos1.col];
        board[pos1.row][pos1.col] = board[pos2.row][pos2.col];
        board[pos2.row][pos2.col] = temp;
        
        // 检查匹配
        const result = this.findMatches(board);
        
        // 恢复原状
        board[pos2.row][pos2.col] = board[pos1.row][pos1.col];
        board[pos1.row][pos1.col] = temp;
        
        return result.hasMatches;
    }
}