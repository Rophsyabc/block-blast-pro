package com.ropsoardev.blockblastpro;

public class Solution {
    public BlockName[] order;
    public String[] mostTopLefts;
    public int score;

    public Solution() {}

    public Solution(BlockName[] order, String[] mostTopLefts, int score) {
        this.order = order;
        this.mostTopLefts = mostTopLefts;
        this.score = score;
    }
}
